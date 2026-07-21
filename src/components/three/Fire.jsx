import { useRef } from 'react'
import { extend, useFrame } from '@react-three/fiber'
import { Billboard, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { noiseGLSL } from './materials.jsx'

/**
 * O fogo procedural (FBM, ~32 hashes por fragmento) era o item mais caro da
 * cena em iGPU: dois billboards aditivos sobrepostos pagando o shader inteiro
 * TODO frame. Agora o shader roda UMA vez no mount: 64 frames de um loop
 * perfeito assados num atlas 8x8 via render target; a chama em cena vira
 * playback (2 taps de textura + crossfade entre frames). Visual igual, custo
 * de fragmento ~zero.
 */
const COLS = 8
const ROWS = 8
const FRAMES = COLS * ROWS
const TILE_W = 128
const TILE_H = 192
const LOOP_SECONDS = 3.2 // 64 frames / 3.2s = 20fps no playback
const FPS = FRAMES / LOOP_SECONDS

const bakeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// o truque do loop: mistura o campo de turbulência em t e t-LOOP com peso
// igual à fase — frame 63 emenda no frame 0 sem pulo visível
const bakeFragment = /* glsl */ `
  uniform float uPhase;
  varying vec2 vUv;

  ${noiseGLSL}

  float turb(vec2 uv, float t) {
    float v = fbm(vec2(uv.x * 4.0, uv.y * 5.0 - t * 2.4));
    v += 0.5 * fbm(vec2(uv.x * 9.0 + 13.7, uv.y * 11.0 - t * 4.1));
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = 7.0 + uPhase * ${LOOP_SECONDS.toFixed(1)};
    float turbulence = mix(turb(uv, t), turb(uv, t - ${LOOP_SECONDS.toFixed(1)}), uPhase);

    float centre = 1.0 - abs(uv.x - 0.5) * 2.0;
    float body = centre * (1.0 - uv.y);
    float flame = smoothstep(0.12, 0.62, body * 0.9 + turbulence * 0.45 - uv.y * 0.35);

    // força a chama a zerar ANTES das bordas do tile: sem isso a turbulência
    // sozinha (independente do 'centre') levava fogo até uv.x=0/1 e o plano
    // cortava reto — a borda vertical visível na largura da chama
    flame *= smoothstep(0.0, 0.17, uv.x) * smoothstep(1.0, 0.83, uv.x);
    flame *= smoothstep(0.0, 0.05, uv.y);

    vec3 col = mix(vec3(0.55, 0.03, 0.0), vec3(1.0, 0.33, 0.02), flame);
    col = mix(col, vec3(1.0, 0.85, 0.4), pow(flame, 3.0));

    gl_FragColor = vec4(col * 1.5, flame);
  }
`

let cachedAtlas = null

function getFlameAtlas(gl) {
  if (cachedAtlas) return cachedAtlas

  const target = new THREE.WebGLRenderTarget(COLS * TILE_W, ROWS * TILE_H, {
    depthBuffer: false,
    stencilBuffer: false,
  })
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 1)
  camera.position.z = 0.5
  const material = new THREE.ShaderMaterial({
    vertexShader: bakeVertex,
    fragmentShader: bakeFragment,
    uniforms: { uPhase: { value: 0 } },
  })
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
  scene.add(quad)

  const prevTarget = gl.getRenderTarget()
  target.scissorTest = true
  for (let i = 0; i < FRAMES; i++) {
    material.uniforms.uPhase.value = i / FRAMES
    const x = (i % COLS) * TILE_W
    const y = Math.floor(i / COLS) * TILE_H
    target.viewport.set(x, y, TILE_W, TILE_H)
    target.scissor.set(x, y, TILE_W, TILE_H)
    gl.setRenderTarget(target)
    gl.render(scene, camera)
  }
  gl.setRenderTarget(prevTarget)

  quad.geometry.dispose()
  material.dispose()

  cachedAtlas = target.texture
  return cachedAtlas
}

const BakedFlameMaterial = shaderMaterial(
  { uMap: null, uTime: 0, uPhase: 0, uFade: 1 },
  bakeVertex,
  /* glsl */ `
    uniform sampler2D uMap;
    uniform float uTime;
    uniform float uPhase;
    uniform float uFade;
    varying vec2 vUv;

    const vec2 TILES = vec2(${COLS.toFixed(1)}, ${ROWS.toFixed(1)});
    const float FRAMES = ${FRAMES.toFixed(1)};
    // meia borda pra dentro do tile: sem isso o filtro linear sangra a base
    // brilhante do tile vizinho como um risco no topo da chama
    const vec2 INSET = vec2(1.5 / ${TILE_W.toFixed(1)}, 1.5 / ${TILE_H.toFixed(1)});

    vec4 tap(vec2 uv, float idx) {
      vec2 tile = vec2(mod(idx, TILES.x), floor(idx / TILES.x));
      return texture2D(uMap, (uv + tile) / TILES);
    }

    void main() {
      float f = mod(uTime * ${FPS.toFixed(1)} + uPhase, FRAMES);
      float i0 = floor(f);
      vec2 uv = vUv * (1.0 - 2.0 * INSET) + INSET;
      vec4 c = mix(tap(uv, i0), tap(uv, mod(i0 + 1.0, FRAMES)), f - i0);
      c *= uFade;
      if (c.a < 0.01) discard;
      gl_FragColor = c;
    }
  `,
  (mat) => {
    mat.transparent = true
    mat.depthWrite = false
    mat.blending = THREE.AdditiveBlending
  }
)

extend({ BakedFlameMaterial })

/**
 * Labareda: um plano único sempre virado pra câmera (billboard) tocando o
 * atlas assado. Instâncias com seed diferente entram em fases diferentes do
 * loop e não parecem clones.
 */
export function Flame({ position = [0, 0, 0], scale = 1, intensity = 1, seed = 0, level = 1, levelRef, dimRef }) {
  const mat = useRef()
  const cur = useRef(1)

  useFrame(({ clock, gl }, delta) => {
    const target = (levelRef?.current ?? level) * (1 - (dimRef?.current ?? 0) * 0.92)
    cur.current = THREE.MathUtils.damp(cur.current, target, 2.5, delta)
    if (mat.current) {
      if (!mat.current.uMap) mat.current.uMap = getFlameAtlas(gl)
      mat.current.uTime = clock.elapsedTime
      mat.current.uFade = intensity * cur.current
    }
  })

  return (
    <Billboard position={position} scale={scale}>
      <mesh position-y={0.62}>
        <planeGeometry args={[1.0, 1.4]} />
        <bakedFlameMaterial ref={mat} uPhase={seed * 17.3} uFade={intensity} />
      </mesh>
    </Billboard>
  )
}

/**
 * Fumaça: pontos subindo com turbulência, esmaecendo com a altura.
 */
export function Smoke({ position = [0, 0, 0], count = 40, height = 2.2, level = 1, levelRef, dimRef }) {
  const points = useRef()
  const cur = useRef(1)

  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 0.4
    positions[i * 3 + 1] = Math.random() * height
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4
    seeds[i] = Math.random()
  }

  useFrame(({ clock }, delta) => {
    const pos = points.current.geometry.attributes.position
    const t = clock.elapsedTime
    // aba em background devolve um delta gigante no primeiro frame de volta;
    // sem clamp o X (que nunca é resetado) espalharia as partículas pra sempre
    const dt = Math.min(delta, 0.1)
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) + dt * (0.35 + seeds[i] * 0.35)
      if (y > height) y = 0
      pos.setY(i, y)
      pos.setX(i, pos.getX(i) + Math.sin(t * 1.2 + seeds[i] * 20) * dt * 0.08)
    }
    pos.needsUpdate = true
    const target = (levelRef?.current ?? level) * (1 - (dimRef?.current ?? 0) * 0.92)
    cur.current = THREE.MathUtils.damp(cur.current, target, 2.5, delta)
    points.current.material.opacity = (0.28 + Math.sin(t * 3) * 0.04) * cur.current
  })

  return (
    <points ref={points} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.28}
        color="#555560"
        transparent
        opacity={0.3}
        depthWrite={false}
        map={smokeSprite()}
        sizeAttenuation
      />
    </points>
  )
}

let cachedSprite = null
function smokeSprite() {
  if (cachedSprite) return cachedSprite
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,0.8)')
  grad.addColorStop(0.4, 'rgba(255,255,255,0.3)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 64, 64)
  cachedSprite = new THREE.CanvasTexture(canvas)
  return cachedSprite
}

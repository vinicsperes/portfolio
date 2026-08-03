import { useMemo, useRef } from 'react'
import { extend, useFrame } from '@react-three/fiber'
import { Billboard, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { noiseGLSL } from './materials.jsx'
import { IS_MOBILE } from '../../scene/deviceTier.js'

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
// meio tile em mobile: a chama é um billboard pequeno na tela, e o atlas cai de
// 1024x1536 (~6MB de VRAM, 1.5M fragmentos de fbm no mount) pra 512x768
const TILE_W = IS_MOBILE ? 64 : 128
const TILE_H = IS_MOBILE ? 96 : 192
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
 * Tempo do fogo, acumulado no delta em vez de lido do relógio da cena.
 *
 * NÃO dá pra usar `clock.elapsedTime` aqui: o R3F ZERA o relógio toda vez que o
 * frameloop muda (`setFrameloop` faz `clock.elapsedTime = 0`), e o hero alterna
 * entre 'always' e 'never' conforme entra e sai da viewport. Como a chama é um
 * loop de 3.2s tocado pela fase, zerar o relógio jogava ela de estalo pro
 * primeiro frame — era o "trava e reseta" (travada porque, com o frameloop em
 * 'never', qualquer render avulso desenha sempre o mesmo t=0). Com tempo
 * próprio ela retoma de onde parou.
 *
 * O clamp segura o salto de quando a aba volta do background com um delta de
 * vários segundos.
 */
function useOwnTime() {
  const t = useRef(0)
  return (delta) => (t.current += Math.min(delta, 0.1))
}

/**
 * Labareda: um plano único sempre virado pra câmera (billboard) tocando o
 * atlas assado. Instâncias com seed diferente entram em fases diferentes do
 * loop e não parecem clones.
 */
export function Flame({ position = [0, 0, 0], scale = 1, intensity = 1, seed = 0, level = 1, levelRef, dimRef }) {
  const mat = useRef()
  const cur = useRef(1)
  const tick = useOwnTime()

  useFrame(({ gl }, delta) => {
    const t = tick(delta)
    const target = (levelRef?.current ?? level) * (1 - (dimRef?.current ?? 0) * 0.92)
    cur.current = THREE.MathUtils.damp(cur.current, target, 2.5, delta)
    if (mat.current) {
      if (!mat.current.uMap) mat.current.uMap = getFlameAtlas(gl)
      mat.current.uTime = t
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
 * Material da fumaça: a subida e a ondulação acontecem no VERTEX SHADER, a
 * partir de uma semente estática por partícula. Antes o useFrame percorria as
 * 40 partículas em CPU chamando getY/setY/getX/setX e marcava
 * `position.needsUpdate = true`, o que re-enviava o buffer inteiro pra GPU em
 * TODO frame. Agora o useFrame só escreve dois uniforms.
 */
const SmokeMaterial = shaderMaterial(
  { uMap: null, uTime: 0, uOpacity: 0.3, uHeight: 2.2, uSize: 0.28, uScale: 300 },
  /* glsl */ `
    attribute float aSeed;
    uniform float uTime;
    uniform float uHeight;
    uniform float uSize;
    uniform float uScale;
    varying float vFade;

    void main() {
      // sobe em loop; cada partícula com velocidade e fase próprias
      float speed = 0.35 + aSeed * 0.35;
      float y = mod(position.y + uTime * speed, uHeight);
      float x = position.x + sin(uTime * 1.2 + aSeed * 20.0) * 0.08;
      vec4 mv = modelViewMatrix * vec4(x, y, position.z, 1.0);

      // esmaece nas duas pontas: some no topo e nasce sem "piscar" embaixo
      float h = y / uHeight;
      vFade = smoothstep(0.0, 0.12, h) * (1.0 - smoothstep(0.55, 1.0, h));

      // mesma conta do sizeAttenuation do PointsMaterial:
      // (size * pixelRatio) * (alturaDoCanvas * 0.5 / -z), tudo em uScale
      gl_PointSize = uSize * uScale / -mv.z;
      gl_Position = projectionMatrix * mv;
    }
  `,
  /* glsl */ `
    uniform sampler2D uMap;
    uniform float uOpacity;
    varying float vFade;

    void main() {
      vec4 c = texture2D(uMap, gl_PointCoord);
      float a = c.a * uOpacity * vFade;
      if (a < 0.004) discard;
      gl_FragColor = vec4(vec3(0.333, 0.333, 0.376), a);
    }
  `,
  (mat) => {
    mat.transparent = true
    mat.depthWrite = false
  }
)

extend({ SmokeMaterial })

/**
 * Fumaça: pontos subindo com turbulência, esmaecendo com a altura.
 */
export function Smoke({ position = [0, 0, 0], count = 40, height = 2.2, level = 1, levelRef, dimRef }) {
  const mat = useRef()
  const cur = useRef(1)
  // mesmo motivo da chama: o relógio da cena zera quando o frameloop muda
  const tick = useOwnTime()

  // sem useMemo isso era realocado a cada render do componente
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.4
      positions[i * 3 + 1] = Math.random() * height
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4
      seeds[i] = Math.random()
    }
    return { positions, seeds }
  }, [count, height])

  useFrame(({ gl, size }, delta) => {
    const t = tick(delta)
    const m = mat.current
    if (!m) return
    const target = (levelRef?.current ?? level) * (1 - (dimRef?.current ?? 0) * 0.92)
    cur.current = THREE.MathUtils.damp(cur.current, target, 2.5, delta)
    m.uTime = t
    m.uOpacity = (0.28 + Math.sin(t * 3) * 0.04) * cur.current
    m.uScale = size.height * 0.5 * gl.getPixelRatio()
  })

  return (
    <points position={position} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <smokeMaterial ref={mat} uMap={smokeSprite()} uHeight={height} uSize={0.28} />
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

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox, useTexture } from '@react-three/drei'

const WOOD = '#5c3a24'
const WOOD_DARK = '#3a2414'
const WALL = '#18181f'

/**
 * Acabamento padrão das texturas procedurais: sRGB (cores como autoradas)
 * + anisotropia (nitidez no ângulo rasante — chão/tapete deixam de virar
 * mancha ao longe). Custo de GPU desprezível.
 */
function polish(tex, aniso = 8) {
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = aniso
  return tex
}

/* ───────────────────────────────────────────────────────────
   Procedural Textures
   ─────────────────────────────────────────────────────────── */

function useWoodFloorTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')

    // Base
    ctx.fillStyle = WOOD
    ctx.fillRect(0, 0, 1024, 1024)

    const plankH = 128
    for (let y = 0; y < 1024; y += plankH) {
      // Plank gap
      ctx.fillStyle = '#2a1608'
      ctx.fillRect(0, y, 1024, 2)

      // Staggered vertical joints
      const off = (y / plankH) % 2 === 0 ? 0 : 300
      for (let x = off; x < 1024; x += 512) {
        ctx.fillRect(x, y, 2, plankH)
      }

      // Wood grain
      ctx.strokeStyle = 'rgba(90,55,30,0.25)'
      ctx.lineWidth = 1
      for (let i = 0; i < 10; i++) {
        const gy = y + 8 + i * (plankH / 10)
        ctx.beginPath()
        ctx.moveTo(0, gy)
        for (let gx = 0; gx < 1024; gx += 15) {
          ctx.lineTo(gx, gy + Math.sin(gx * 0.015 + i * 0.8 + y * 0.01) * 2.5)
        }
        ctx.stroke()
      }

      // Subtle per-plank color variation
      const r = 60 + ((y * 7 + 13) % 40)
      const g = 30 + ((y * 3 + 7) % 20)
      const b = 10 + ((y * 11 + 3) % 10)
      ctx.fillStyle = `rgba(${r},${g},${b},0.06)`
      ctx.fillRect(0, y + 2, 1024, plankH - 2)
    }

    // Knots
    for (let i = 0; i < 6; i++) {
      const kx = ((i * 317 + 53) % 1024)
      const ky = ((i * 211 + 97) % 1024)
      const kr = 8 + (i % 3) * 5
      const grad = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr)
      grad.addColorStop(0, 'rgba(30,15,5,0.5)')
      grad.addColorStop(0.6, 'rgba(50,30,15,0.2)')
      grad.addColorStop(1, 'rgba(70,40,20,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(kx, ky, kr, 0, Math.PI * 2)
      ctx.fill()
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    // 6x: tábuas ~1.2m — mais detalhe de perto sem ficar "busy" de longe
    tex.repeat.set(6, 6)
    return polish(tex)
  }, [])
}

/** Tampo da mesa: madeira escura com veio horizontal — tira o "bloco chapado". */
function useDeskWoodTexture() {
  return useMemo(() => {
    const S = 512
    const canvas = document.createElement('canvas')
    canvas.width = S
    canvas.height = S
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = WOOD_DARK
    ctx.fillRect(0, 0, S, S)

    // veios horizontais em dois tons, ondulando de leve
    for (let i = 0; i < 46; i++) {
      const y = (i * 137) % S
      const light = i % 3 === 0
      ctx.strokeStyle = light ? 'rgba(110,72,40,0.22)' : 'rgba(16,9,4,0.28)'
      ctx.lineWidth = light ? 1.5 : 2.5
      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x <= S; x += 16) {
        ctx.lineTo(x, y + Math.sin(x * 0.02 + i * 1.7) * 3)
      }
      ctx.stroke()
    }

    // nós discretos
    for (let i = 0; i < 3; i++) {
      const kx = (i * 197 + 80) % S
      const ky = (i * 311 + 140) % S
      const grad = ctx.createRadialGradient(kx, ky, 2, kx, ky, 14)
      grad.addColorStop(0, 'rgba(12,7,3,0.6)')
      grad.addColorStop(1, 'rgba(12,7,3,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(kx, ky, 14, 0, Math.PI * 2)
      ctx.fill()
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(2, 1)
    return polish(tex)
  }, [])
}

/** Parede: reboco com mancha sutil — quebra o preto chapado sem chamar atenção. */
function useWallTexture() {
  return useMemo(() => {
    const S = 256
    const canvas = document.createElement('canvas')
    canvas.width = S
    canvas.height = S
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = WALL
    ctx.fillRect(0, 0, S, S)

    // manchas suaves claras e escuras (determinístico, sem Math.random)
    for (let i = 0; i < 240; i++) {
      const x = (i * 97.3) % S
      const y = (i * 57.7) % S
      const r = 6 + (i % 5) * 4
      const up = i % 2 === 0
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0, up ? 'rgba(200,205,225,0.022)' : 'rgba(0,0,0,0.05)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(8, 4)
    return polish(tex, 4)
  }, [])
}

/**
 * Tapete persa (paisagem): campo em vermelho-tijolo apagado, bordas finas,
 * treliça sutil de losangos, medalhão central em contorno e cantos
 * arredondados via clip + alpha.
 */
function useRugTexture() {
  return useMemo(() => {
    const W = 1536
    const H = 1024
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    const BRICK = '#5e2620'
    const BRICK_DARK = '#4a1d19'
    const CHARCOAL = '#22262e'
    const SAND = '#c8b088'
    const GOLD = '#a8874a'

    // clip com cantos arredondados — fora fica transparente
    const R = 42
    ctx.beginPath()
    ctx.roundRect(0, 0, W, H, R)
    ctx.clip()

    // campo
    ctx.fillStyle = BRICK
    ctx.fillRect(0, 0, W, H)

    // ruído de fibra (linhas horizontais muito sutis)
    for (let y = 0; y < H; y += 3) {
      const a = 0.03 + 0.03 * Math.abs(Math.sin(y * 0.7))
      ctx.fillStyle = `rgba(0,0,0,${a})`
      ctx.fillRect(0, y, W, 1)
    }

    // bordas: banda externa charcoal, filete sand, banda interna escura
    const band = (o, w, c) => {
      ctx.fillStyle = c
      ctx.fillRect(o, o, W - o * 2, w)
      ctx.fillRect(o, H - o - w, W - o * 2, w)
      ctx.fillRect(o, o, w, H - o * 2)
      ctx.fillRect(W - o - w, o, w, H - o * 2)
    }
    band(26, 34, CHARCOAL)
    band(70, 4, SAND)
    band(84, 22, BRICK_DARK)
    band(116, 3, GOLD)

    // treliça de losangos no campo (bem discreta)
    const step = 96
    ctx.strokeStyle = 'rgba(200,176,136,0.10)'
    ctx.lineWidth = 2
    for (let y = 150; y < H - 150; y += step) {
      for (let x = 150; x < W - 150; x += step) {
        ctx.beginPath()
        ctx.moveTo(x, y - step / 2)
        ctx.lineTo(x + step / 2, y)
        ctx.lineTo(x, y + step / 2)
        ctx.lineTo(x - step / 2, y)
        ctx.closePath()
        ctx.stroke()
      }
    }

    // medalhão central: losangos concêntricos em contorno
    const cx = W / 2
    const cy = H / 2
    const diamond = (rw, rh, color, lw) => {
      ctx.strokeStyle = color
      ctx.lineWidth = lw
      ctx.beginPath()
      ctx.moveTo(cx, cy - rh)
      ctx.lineTo(cx + rw, cy)
      ctx.lineTo(cx, cy + rh)
      ctx.lineTo(cx - rw, cy)
      ctx.closePath()
      ctx.stroke()
    }
    diamond(320, 210, SAND, 5)
    diamond(260, 170, GOLD, 3)
    diamond(185, 120, 'rgba(200,176,136,0.55)', 2)
    // núcleo pequeno preenchido
    ctx.fillStyle = CHARCOAL
    ctx.beginPath()
    ctx.moveTo(cx, cy - 38)
    ctx.lineTo(cx + 56, cy)
    ctx.lineTo(cx, cy + 38)
    ctx.lineTo(cx - 56, cy)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 2
    ctx.stroke()

    // quartos de medalhão ecoando nos cantos do campo
    const corner = (x, y, sx, sy) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(sx, sy)
      ctx.strokeStyle = 'rgba(200,176,136,0.4)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, 190)
      ctx.lineTo(130, 0)
      ctx.moveTo(0, 130)
      ctx.lineTo(90, 0)
      ctx.stroke()
      ctx.restore()
    }
    corner(140, 140, 1, 1)
    corner(W - 140, 140, -1, 1)
    corner(140, H - 140, 1, -1)
    corner(W - 140, H - 140, -1, -1)

    // vinheta de tecido
    const vig = ctx.createRadialGradient(cx, cy, H * 0.25, cx, cy, H * 0.75)
    vig.addColorStop(0, 'rgba(0,0,0,0)')
    vig.addColorStop(1, 'rgba(0,0,0,0.22)')
    ctx.fillStyle = vig
    ctx.fillRect(0, 0, W, H)

    return polish(new THREE.CanvasTexture(canvas))
  }, [])
}

/**
 * Vista de golden hour de um apartamento alto: céu em degradê quente
 * (âmbar → rosa → azul), sol baixo com halo, skyline distante recortada
 * contra a luz e reflexos nas janelas dos prédios.
 */
function useGoldenViewTexture() {
  return useMemo(() => {
    const W = 1024
    const H = 512
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // céu golden hour: azul lá em cima descendo pra âmbar/rosa no horizonte
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#3b4a7a')
    sky.addColorStop(0.35, '#8a6a92')
    sky.addColorStop(0.62, '#e08b5c')
    sky.addColorStop(0.82, '#f6b25a')
    sky.addColorStop(1, '#ffd47a')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)

    // brilho difuso do sol perto do horizonte
    const sx = W * 0.7
    const sy = H * 0.6
    const glow = ctx.createRadialGradient(sx, sy, 10, sx, sy, 300)
    glow.addColorStop(0, 'rgba(255,240,200,0.95)')
    glow.addColorStop(0.3, 'rgba(255,210,140,0.55)')
    glow.addColorStop(1, 'rgba(255,200,120,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // disco do sol
    ctx.fillStyle = '#fff2d0'
    ctx.beginPath()
    ctx.arc(sx, sy, 34, 0, Math.PI * 2)
    ctx.fill()

    // nuvens finas alongadas pegando a luz
    for (let i = 0; i < 7; i++) {
      const cy = 60 + i * 34 + (i % 2) * 10
      const cw = 180 + (i * 90) % 360
      const cx = (i * 260 + 60) % W
      ctx.fillStyle = `rgba(255,${210 - i * 8},${170 - i * 6},${0.1 + (i % 3) * 0.05})`
      ctx.beginPath()
      ctx.ellipse(cx, cy, cw, 9, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // skyline distante recortada contra a luz (silhueta quente-escura)
    const farBuildings = [
      [0, 70], [60, 100], [130, 55], [200, 120], [280, 80], [350, 140],
      [420, 70], [500, 110], [580, 90], [660, 135], [740, 75], [820, 115],
      [900, 60], [960, 95],
    ]
    farBuildings.forEach(([x, h], i) => {
      const w = 46 + (i % 3) * 16
      ctx.fillStyle = i % 2 ? '#5a3f44' : '#4a343d'
      ctx.fillRect(x, H - h, w, h)
      // janelas refletindo o pôr do sol
      ctx.fillStyle = 'rgba(255,200,120,0.5)'
      for (let r = 0; r < Math.floor(h / 22); r++) {
        for (let c = 0; c < 3; c++) {
          if ((r + c + i) % 2 === 0) {
            ctx.fillRect(x + 8 + c * 14, H - h + 12 + r * 20, 7, 10)
          }
        }
      }
    })

    return polish(new THREE.CanvasTexture(canvas), 2)
  }, [])
}

/* ───────────────────────────────────────────────────────────
   Sub-components
   ─────────────────────────────────────────────────────────── */

/** Luz quente da mesa (sem luminária visível — o brilho vem "da bagunça"). */
function DeskGlow({ position }) {
  const lightRef = useRef()
  useFrame(({ clock }) => {
    if (lightRef.current) {
      // very subtle flicker
      lightRef.current.intensity = 3.2 + Math.sin(clock.elapsedTime * 3) * 0.12
    }
  })
  return (
    <pointLight ref={lightRef} position={position} color="#ffd090" intensity={3.2} distance={8} decay={2} />
  )
}

/* ───────────────────────────────────────────────────────────
   Main Room Component
   ─────────────────────────────────────────────────────────── */

/**
 * O quarto enxuto: chão, tapete, parede, janela panorâmica, mesa com o PC
 * e o porta-retrato pendurado na parede (a view do about dá zoom nele).
 * Sem hotspots — a cena é um quadro vivo; a navegação mora no HTML.
 */
export function Room() {
  const woodTex = useWoodFloorTexture()
  const deskTex = useDeskWoodTexture()
  const wallTex = useWallTexture()
  const rugTex = useRugTexture()
  const skyTex = useGoldenViewTexture()
  const kidTex = useTexture('/img/vini-kid.jpg', (t) => polish(t, 4))

  return (
    <group>
      {/* ─── Floor ─── */}
      <mesh position={[0, -2.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        {/* bump reusa a própria textura — relevo sutil dos veios, custo ~zero */}
        <meshStandardMaterial map={woodTex} bumpMap={woodTex} bumpScale={0.9} roughness={0.72} />
      </mesh>

      {/* ─── Rug (no vão livre à frente da mesa) ─── */}
      <mesh position={[0.2, -2.09, 2.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9.2, 6.2]} />
        <meshStandardMaterial map={rugTex} roughness={1} transparent />
      </mesh>

      {/* ─── Back Wall ─── */}
      <mesh position={[0, 4, -6]} receiveShadow>
        <planeGeometry args={[60, 20]} />
        <meshStandardMaterial map={wallTex} roughness={0.95} />
      </mesh>

      {/* ─── Baseboard ─── */}
      <mesh position={[0, -1.95, -5.85]} castShadow>
        <boxGeometry args={[60, 0.3, 0.12]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
      </mesh>

      {/* ─── Desk ─── */}
      <group position={[3, -2.1, -2]}>
        {/* Table top */}
        <RoundedBox args={[8, 0.18, 4.4]} radius={0.03} position={[0, 2.1, 0]} receiveShadow castShadow>
          <meshStandardMaterial map={deskTex} roughness={0.5} />
        </RoundedBox>
        {/* Front apron */}
        <mesh position={[0, 1.95, 2.1]} castShadow>
          <boxGeometry args={[7.8, 0.15, 0.06]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.6} />
        </mesh>
        {/* Legs */}
        {[-3.7, 3.7].map((x) =>
          [-1.9, 1.9].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 1.05, z]} receiveShadow castShadow>
              <boxGeometry args={[0.2, 2.1, 0.2]} />
              <meshStandardMaterial color={WOOD_DARK} roughness={0.6} />
            </mesh>
          ))
        )}
      </group>

      {/* luz quente da mesa */}
      <DeskGlow position={[5.8, 1.2, -2.4]} />

      {/* ─── Window (panorâmica) ─── */}
      <group position={[-5.2, 3.0, -5.9]}>
        {/* Caixilho fino, moderno (alumínio claro) — apartamento contemporâneo */}
        <RoundedBox args={[7.4, 3.6, 0.2]} radius={0.04} castShadow>
          <meshStandardMaterial color="#3a4048" roughness={0.35} metalness={0.5} />
        </RoundedBox>
        {/* Golden hour view */}
        <mesh position={[0, 0, 0.11]}>
          <planeGeometry args={[7.0, 3.15]} />
          <meshBasicMaterial map={skyTex} toneMapped={false} />
        </mesh>
        {/* leve reflexo de vidro quente */}
        <mesh position={[0, 0, 0.12]}>
          <planeGeometry args={[7.0, 3.15]} />
          <meshStandardMaterial
            color="#ffcf99"
            roughness={0.06}
            metalness={0.3}
            transparent
            opacity={0.06}
          />
        </mesh>
        {/* Caixilho moderno: 1 travessa fina + 1 montante central (2 panos amplos) */}
        <RoundedBox args={[7.1, 0.06, 0.08]} radius={0.015} position={[0, 0, 0.13]}>
          <meshStandardMaterial color="#2a2f36" roughness={0.3} metalness={0.5} />
        </RoundedBox>
        <RoundedBox args={[0.06, 3.2, 0.08]} radius={0.015} position={[0, 0, 0.13]}>
          <meshStandardMaterial color="#2a2f36" roughness={0.3} metalness={0.5} />
        </RoundedBox>
        {/* Window sill */}
        <RoundedBox args={[7.8, 0.1, 0.4]} radius={0.02} position={[0, -1.85, 0.15]} castShadow>
          <meshStandardMaterial color="#2d3340" roughness={0.5} />
        </RoundedBox>
      </group>

      {/* ─── Porta-retrato pendurado na parede (view do about dá zoom aqui):
          foto da primeira vez no palco — a origem da história ─── */}
      <group position={[0.6, 3.1, -5.86]}>
        {/* Frame */}
        <RoundedBox args={[1.06, 0.78, 0.1]} radius={0.025} castShadow>
          <meshStandardMaterial color="#1a1510" roughness={0.7} metalness={0.1} />
        </RoundedBox>
        {/* passe-partout */}
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[0.94, 0.66]} />
          <meshStandardMaterial color="#e8e2d2" roughness={1} />
        </mesh>
        {/* foto */}
        <mesh position={[0, 0, 0.07]}>
          <planeGeometry args={[0.86, 0.57]} />
          <meshStandardMaterial map={kidTex} roughness={0.9} />
        </mesh>
        {/* luz de leitura discreta — dá vida ao close do about */}
        <pointLight position={[0, 0.35, 1.1]} color="#ffd090" intensity={1.4} distance={3.5} decay={2} />
      </group>
    </group>
  )
}

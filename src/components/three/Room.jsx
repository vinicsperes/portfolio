import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox, Sparkles, useTexture } from '@react-three/drei'
import { Hotspot } from './Hotspot.jsx'
import { CandleCluster } from './Candles.jsx'

const WOOD = '#5c3a24'
const WOOD_DARK = '#3a2414'
const WALL = '#18181f'

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
    tex.repeat.set(4, 4)
    return tex
  }, [])
}

/**
 * Tapete persa redesenhado (paisagem): campo em vermelho-tijolo apagado,
 * bordas finas, treliça sutil de losangos, medalhão central em CONTORNO,
 * cantos arredondados via clip + alpha, e leve vinheta de tecido.
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

    return new THREE.CanvasTexture(canvas)
  }, [])
}

/**
 * Parede: reboco pintado com grão, manchas amplas e sujeirinha nos cantos.
 * Sem isso ela lia como fundo preto chapado ao lado do chão texturizado.
 */
function useWallTexture() {
  return useMemo(() => {
    const S = 1024
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = S
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = WALL
    ctx.fillRect(0, 0, S, S)

    // manchas largas de tinta/umidade: quebram o chapado em áreas grandes
    for (let i = 0; i < 26; i++) {
      const x = (i * 271 + 61) % S
      const y = (i * 397 + 137) % S
      const r = 90 + ((i * 53) % 150)
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      const light = i % 3 === 0
      g.addColorStop(0, light ? 'rgba(58,52,64,0.16)' : 'rgba(6,6,10,0.2)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // grão fino do reboco
    const img = ctx.getImageData(0, 0, S, S)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 18
      d[i] += n
      d[i + 1] += n
      d[i + 2] += n * 1.1
    }
    ctx.putImageData(img, 0, 0)

    // riscos verticais discretos (marca de rolo de pintura)
    ctx.globalAlpha = 0.06
    for (let i = 0; i < 40; i++) {
      const x = (i * 149 + 23) % S
      ctx.fillStyle = i % 2 ? '#3c3646' : '#08080c'
      ctx.fillRect(x, 0, 1 + (i % 3), S)
    }
    ctx.globalAlpha = 1

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(5, 2)
    return tex
  }, [])
}

/** Vista golden hour pela janela: céu quente, sol baixo e skyline em silhueta. */
function useSunsetViewTexture() {
  return useMemo(() => {
    const W = 1024
    const H = 512
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // céu golden hour (violeta no topo → laranja/amarelo no horizonte)
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#39335f')
    sky.addColorStop(0.42, '#b85d78')
    sky.addColorStop(0.72, '#ef9257')
    sky.addColorStop(1, '#ffcb7d')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)

    // brilho difuso do sol baixo
    const sx = W * 0.72
    const sy = H * 0.6
    const glow = ctx.createRadialGradient(sx, sy, 10, sx, sy, 260)
    glow.addColorStop(0, 'rgba(255,240,200,0.9)')
    glow.addColorStop(0.3, 'rgba(255,214,150,0.45)')
    glow.addColorStop(1, 'rgba(255,205,140,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)
    // disco do sol
    ctx.fillStyle = '#fff2d2'
    ctx.beginPath()
    ctx.arc(sx, sy, 44, 0, Math.PI * 2)
    ctx.fill()

    // skyline em silhueta quente
    ctx.fillStyle = '#5a3344'
    const buildings = [
      [0, 90], [55, 130], [125, 70], [195, 150], [270, 100], [335, 170],
      [410, 90], [480, 140], [555, 110], [625, 165], [700, 95], [770, 135],
      [845, 75], [910, 120], [975, 85],
    ]
    buildings.forEach(([x, h], i) => {
      const w = 42 + (i % 3) * 14
      ctx.fillRect(x, H - h, w, h)
    })
    // janelinhas acesas quentes
    ctx.fillStyle = 'rgba(255,190,90,0.6)'
    for (let i = 0; i < 26; i++) {
      const b = buildings[i % buildings.length]
      const x = b[0] + 6 + ((i * 13) % 34)
      const y = H - ((i * 29) % (b[1] - 14)) - 8
      ctx.fillRect(x, y, 3, 4)
    }

    // haze quente na base do horizonte
    const haze = ctx.createLinearGradient(0, H * 0.72, 0, H)
    haze.addColorStop(0, 'rgba(255,190,120,0)')
    haze.addColorStop(1, 'rgba(255,178,110,0.32)')
    ctx.fillStyle = haze
    ctx.fillRect(0, H * 0.72, W, H * 0.28)

    return new THREE.CanvasTexture(canvas)
  }, [])
}

/* ───────────────────────────────────────────────────────────
   Sub-components
   ─────────────────────────────────────────────────────────── */

/**
 * Janelinhas dos prédios acendendo/apagando devagar (vida no skyline).
 * Barato: uns poucos quads com opacity mutada por ref no useFrame —
 * zero setState, zero upload de textura. Coordenadas locais do grupo
 * da janela (plano da vista: 8.2×3.9; prédios na faixa de baixo).
 */
function CityLights() {
  const mats = useRef([])
  const lights = useMemo(
    () => [
      { x: -3.62, y: -1.6, speed: 0.31, phase: 0.5 },
      { x: -3.05, y: -1.15, speed: 0.22, phase: 2.1 },
      { x: -2.5, y: -1.66, speed: 0.27, phase: 4.2 },
      { x: -1.85, y: -0.95, speed: 0.19, phase: 1.3 },
      { x: -1.38, y: -1.5, speed: 0.33, phase: 3.7 },
      { x: -0.72, y: -1.72, speed: 0.24, phase: 5.5 },
      { x: -0.18, y: -1.2, speed: 0.29, phase: 0.9 },
      { x: 0.4, y: -1.58, speed: 0.21, phase: 2.8 },
      { x: 0.95, y: -0.9, speed: 0.26, phase: 4.9 },
      { x: 2.72, y: -1.62, speed: 0.23, phase: 1.8 },
      { x: 3.28, y: -1.1, speed: 0.3, phase: 3.2 },
      { x: 3.78, y: -1.68, speed: 0.2, phase: 5.1 },
    ],
    []
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    for (let i = 0; i < lights.length; i++) {
      const m = mats.current[i]
      if (!m) continue
      const l = lights[i]
      // pulso lento e suave, cada janela no seu ritmo
      const s = Math.sin(t * l.speed + l.phase)
      m.opacity = 0.1 + 0.75 * THREE.MathUtils.smoothstep(s, 0.35, 0.8)
    }
  })
  return lights.map((l, i) => (
    <mesh key={i} position={[l.x, l.y, 0.115]}>
      <planeGeometry args={[0.055, 0.07]} />
      <meshBasicMaterial
        ref={(m) => void (mats.current[i] = m)}
        color="#ffc576"
        transparent
        opacity={0.1}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  ))
}

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


/** Bloco de notas com caneta. */
function Notepad({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.5, 0.03, 0.68]} radius={0.008} position={[0, 0.015, 0]} castShadow>
        <meshStandardMaterial color="#e5dfd0" roughness={0.95} />
      </RoundedBox>
      {/* linhas do caderno */}
      {[0.14, 0.04, -0.06, -0.16].map((z) => (
        <mesh key={z} position={[0, 0.032, z]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.4, 0.008]} />
          <meshBasicMaterial color="#8a94a8" />
        </mesh>
      ))}
      {/* caneta */}
      <mesh position={[0.18, 0.05, 0.12]} rotation={[0, 0.7, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.42, 10]} />
        <meshStandardMaterial color="#8a1e1e" roughness={0.3} />
      </mesh>
    </group>
  )
}

/** Prateleiras suspensas na parede (parte do hotspot do "sobre"). */
function WallShelves() {
  const shelfBooks = [
    // prateleira de cima: par de livros à DIREITA (o porta-retrato mora à esquerda)
    [
      { w: 0.16, h: 0.5, color: '#2a3a4a', band: '#c9b083', lean: 0 },
      { w: 0.2, h: 0.55, color: '#4a2a20', band: '#d9c39a', lean: -0.16 },
    ],
    // prateleira de baixo concentra os livros
    [
      { w: 0.2, h: 0.52, color: '#4a3a1a', band: '#e2d2a2', lean: 0 },
      { w: 0.16, h: 0.46, color: '#1a3a3a', band: '#a9c0b4', lean: 0 },
      { w: 0.14, h: 0.5, color: '#2a4a30', band: '#cbb27a', lean: 0 },
      { w: 0.18, h: 0.56, color: '#4a1a2a', band: '#d3a6a6', lean: 0.16 },
    ],
  ]

  const boardY = [0.7, 0]

  return (
    <group>
      {boardY.map((y, si) => (
        <group key={si} position={[0, y, 0]}>
          {/* tábua */}
          <RoundedBox args={[2.3, 0.06, 0.34]} radius={0.01} castShadow>
            <meshStandardMaterial color={WOOD_DARK} roughness={0.6} />
          </RoundedBox>
          {/* mãos francesas */}
          {[-0.9, 0.9].map((x) => (
            <mesh key={x} position={[x, -0.09, -0.06]}>
              <boxGeometry args={[0.05, 0.14, 0.2]} />
              <meshStandardMaterial color="#141414" roughness={0.4} metalness={0.6} />
            </mesh>
          ))}
          {/* livros: corpo + faixas no lombo (não são mais só retângulos) e
              assentados na tábua (sem flutuar) */}
          {(() => {
            // cima: livros começam à direita do retrato; baixo: a partir da esquerda
            let bx = si === 0 ? 0.3 : -1.0
            return shelfBooks[si].map((b, bi) => {
              const x = bx + b.w / 2
              bx += b.w + 0.05
              const depth = 0.24 + (bi % 2) * 0.05
              return (
                <group
                  key={bi}
                  position={[x + (b.lean ? 0.05 : 0), 0.03 + b.h / 2 - Math.abs(b.lean) * 0.05, 0]}
                  rotation-z={b.lean}
                >
                  <RoundedBox args={[b.w, b.h, depth]} radius={0.006} castShadow>
                    <meshStandardMaterial color={b.color} roughness={0.88} />
                  </RoundedBox>
                  {/* faixas do lombo (título) */}
                  <mesh position={[0, b.h * 0.22, depth / 2 + 0.002]}>
                    <planeGeometry args={[b.w * 0.62, b.h * 0.05]} />
                    <meshStandardMaterial color={b.band} roughness={0.5} />
                  </mesh>
                  <mesh position={[0, b.h * 0.09, depth / 2 + 0.002]}>
                    <planeGeometry args={[b.w * 0.44, b.h * 0.022]} />
                    <meshStandardMaterial color={b.band} roughness={0.5} />
                  </mesh>
                </group>
              )
            })
          })()}
        </group>
      ))}
      {/* plantinha na ponta da prateleira de cima */}
      <group position={[0.95, 0.73, 0]} scale={0.45}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.12, 0.24, 12]} />
          <meshStandardMaterial color="#b8654a" roughness={0.9} />
        </mesh>
        {[
          [0, 0.36, 0, 0.13],
          [0.09, 0.3, 0.04, 0.09],
          [-0.08, 0.32, -0.03, 0.1],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[r, 8, 8]} />
            <meshStandardMaterial color="#2a5a30" roughness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ───────────────────────────────────────────────────────────
   Main Room Component
   ─────────────────────────────────────────────────────────── */

export function Room({ onNavigate, labels = {}, activeView, markers = {} }) {
  const woodTex = useWoodFloorTexture()
  const rugTex = useRugTexture()
  const wallTex = useWallTexture()
  const skyTex = useSunsetViewTexture()
  const collageTex = useTexture('/img/ghost-collage-tex.jpg')
  const kidTex = useTexture('/img/vini-kid.jpg')

  return (
    <group>
      {/* ─── Floor ─── */}
      <mesh position={[0, -2.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial map={woodTex} roughness={0.75} />
      </mesh>

      {/* ─── Rug (horizontal, empurrado pra trás — encostado sob a mesa/parede) ─── */}
      <mesh position={[0.2, -2.09, -1.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9.2, 6.2]} />
        <meshStandardMaterial map={rugTex} roughness={1} transparent />
      </mesh>

      {/* ─── Back Wall ─── */}
      <mesh position={[0, 4, -6]} receiveShadow>
        <planeGeometry args={[60, 20]} />
        <meshStandardMaterial map={wallTex} color="#4a4658" roughness={0.95} />
      </mesh>

      {/* ─── Baseboard ─── */}
      <mesh position={[0, -1.95, -5.85]} castShadow>
        <boxGeometry args={[60, 0.3, 0.12]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
      </mesh>

      {/* ─── Desk (mais funda: o PC precisa caber inteiro) — encostada na parede ─── */}
      <group position={[3, -2.1, -3.5]}>
        {/* Table top */}
        <RoundedBox args={[8, 0.18, 4.4]} radius={0.03} position={[0, 2.1, 0]} receiveShadow castShadow>
          <meshStandardMaterial color={WOOD_DARK} roughness={0.55} />
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

      {/* ─── Desk props ─── */}
      <DeskGlow position={[5.8, 1.2, -3.9]} />
      <Notepad position={[5.2, 0.1, -3.1]} rotation={[0, 0.35, 0]} />

      {/* ─── Cozy: velas no parapeito da janela ─── */}
      <CandleCluster position={[-2.55, 1.21, -5.68]} />

      {/* ─── Poeira flutuando no feixe da janela (1 draw call, shader do drei) ─── */}
      <Sparkles
        count={35}
        scale={[5.5, 3.2, 2.6]}
        position={[-2.8, 1.4, -3.9]}
        size={1.8}
        speed={0.22}
        opacity={0.32}
        color="#ffd9a0"
      />

      {/* (estante + porta-retrato vivem juntos no hotspot do "sobre", mais abaixo) */}

      {/* ─── Window (panorâmica, maior, atrás do lockup do título) ─── */}
      <group position={[-5.2, 3.4, -5.9]}>
        {/* Outer frame */}
        <RoundedBox args={[8.8, 4.5, 0.2]} radius={0.05} castShadow>
          <meshStandardMaterial color="#2d3340" roughness={0.5} />
        </RoundedBox>
        {/* Golden hour view */}
        <mesh position={[0, 0, 0.11]}>
          <planeGeometry args={[8.2, 3.9]} />
          <meshBasicMaterial map={skyTex} toneMapped={false} />
        </mesh>
        {/* janelinhas dos prédios acendendo/apagando */}
        <CityLights />
        {/* leve reflexo de vidro */}
        <mesh position={[0, 0, 0.12]}>
          <planeGeometry args={[8.2, 3.9]} />
          <meshStandardMaterial
            color="#e0b88a"
            roughness={0.08}
            metalness={0.3}
            transparent
            opacity={0.08}
          />
        </mesh>
        {/* Cross bars: 1 horizontal + 2 verticais (3 panos) */}
        <RoundedBox args={[8.4, 0.09, 0.08]} radius={0.02} position={[0, 0, 0.13]}>
          <meshStandardMaterial color="#1e2530" roughness={0.4} metalness={0.3} />
        </RoundedBox>
        {[-1.37, 1.37].map((x) => (
          <RoundedBox key={x} args={[0.09, 4.0, 0.08]} radius={0.02} position={[x, 0, 0.13]}>
            <meshStandardMaterial color="#1e2530" roughness={0.4} metalness={0.3} />
          </RoundedBox>
        ))}
        {/* Window sill */}
        <RoundedBox args={[9.2, 0.1, 0.4]} radius={0.02} position={[0, -2.25, 0.15]} castShadow>
          <meshStandardMaterial color="#2d3340" roughness={0.5} />
        </RoundedBox>
      </group>

      {/* ─── Pôster colagem GHOSTFX: papel colado direto na parede (sem
          moldura), levemente torto, com fita adesiva nos cantos. Deslocado
          pra DIREITA das chamas do CRT (o glow do fogo estourava sobre ele) ─── */}
      <group position={[5.3, 4.15, -5.965]} rotation-z={-0.028}>
        <mesh castShadow>
          <planeGeometry args={[2.5, 1.42]} />
          <meshStandardMaterial map={collageTex} roughness={0.92} />
        </mesh>
        {[
          [-1.17, 0.63, 0.7],
          [1.17, 0.63, -0.7],
          [-1.17, -0.63, -0.7],
          [1.17, -0.63, 0.7],
        ].map(([x, y, rz], i) => (
          <mesh key={i} position={[x, y, 0.006]} rotation-z={rz}>
            <planeGeometry args={[0.32, 0.11]} />
            <meshStandardMaterial color="#d8d4c8" transparent opacity={0.5} roughness={0.45} />
          </mesh>
        ))}
      </group>

      {/* ─── Estante + porta-retrato = hotspot do "sobre". A estante INTEIRA
          (prateleiras, livros, cubo mágico, foto) é clicável e faz hover, pra
          ser bem fácil de perceber ─── */}
      <Hotspot
        label={labels.painting}
        labelPosition={[0.0, 4.25, -5.55]}
        onActivate={() => onNavigate?.('about')}
        disabled={activeView === 'about'}
        marker={markers.about}
      >
        {(hovered) => (
          <>
            {/* prateleiras + luz de leitura */}
            <group position={[0.55, 2.62, -5.78]}>
              <WallShelves />
              <pointLight position={[0, 0.4, 1.2]} color="#ffd090" intensity={1.6} distance={4} decay={2} />
            </group>
            {/* porta-retrato em pé na PONTA ESQUERDA da prateleira de cima:
                na view about ele fica ao lado do texto (que mora sobre a janela) */}
            <group position={[0.0, 3.74, -5.72]} rotation-x={-0.07}>
              <RoundedBox args={[1.06, 0.78, 0.14]} radius={0.025} castShadow>
                <meshStandardMaterial color={hovered ? '#2e2218' : '#1a1510'} roughness={0.7} metalness={0.1} />
              </RoundedBox>
              <mesh position={[0, 0, 0.08]}>
                <planeGeometry args={[0.94, 0.66]} />
                <meshStandardMaterial color="#e8e2d2" roughness={1} />
              </mesh>
              <mesh position={[0, 0, 0.09]}>
                <planeGeometry args={[0.86, 0.57]} />
                <meshStandardMaterial map={kidTex} roughness={0.9} />
              </mesh>
            </group>
          </>
        )}
      </Hotspot>
    </group>
  )
}

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox, useTexture } from '@react-three/drei'
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

/** Vista noturna pela janela panorâmica: céu com estrelas, lua e skyline. */
function useNightViewTexture() {
  return useMemo(() => {
    const W = 1024
    const H = 512
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // céu em gradiente
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#0a1220')
    sky.addColorStop(0.7, '#14263e')
    sky.addColorStop(1, '#1d3450')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)

    // estrelas
    for (let i = 0; i < 90; i++) {
      const x = (i * 137.5) % W
      const y = ((i * 89.3) % (H * 0.6))
      const r = i % 11 === 0 ? 1.6 : 0.9
      ctx.fillStyle = i % 7 === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(200,215,235,0.55)'
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // lua com halo
    const mx = W * 0.74
    const my = H * 0.26
    const halo = ctx.createRadialGradient(mx, my, 8, mx, my, 90)
    halo.addColorStop(0, 'rgba(220,230,245,0.5)')
    halo.addColorStop(1, 'rgba(220,230,245,0)')
    ctx.fillStyle = halo
    ctx.fillRect(mx - 90, my - 90, 180, 180)
    ctx.fillStyle = '#dfe8f4'
    ctx.beginPath()
    ctx.arc(mx, my, 26, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(160,175,195,0.5)'
    ctx.beginPath()
    ctx.arc(mx - 8, my - 4, 5, 0, Math.PI * 2)
    ctx.arc(mx + 7, my + 8, 4, 0, Math.PI * 2)
    ctx.fill()

    // skyline distante
    ctx.fillStyle = '#0b1420'
    const buildings = [
      [0, 90], [55, 130], [125, 70], [195, 150], [270, 100], [335, 170],
      [410, 90], [480, 140], [555, 110], [625, 165], [700, 95], [770, 135],
      [845, 75], [910, 120], [975, 85],
    ]
    buildings.forEach(([x, h], i) => {
      const w = 42 + (i % 3) * 14
      ctx.fillRect(x, H - h, w, h)
    })
    // janelinhas acesas
    ctx.fillStyle = 'rgba(245,166,35,0.55)'
    for (let i = 0; i < 26; i++) {
      const b = buildings[i % buildings.length]
      const x = b[0] + 6 + ((i * 13) % 34)
      const y = H - ((i * 29) % (b[1] - 14)) - 8
      ctx.fillRect(x, y, 3, 4)
    }

    return new THREE.CanvasTexture(canvas)
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


function Books({ position, rotation = [0, 0, 0] }) {
  const books = [
    { w: 0.2, h: 0.9, d: 0.65, color: '#2a4a3a', x: 0 },
    { w: 0.18, h: 0.85, d: 0.6, color: '#4a2020', x: 0.22 },
    { w: 0.22, h: 0.95, d: 0.68, color: '#1a2a4a', x: 0.45 },
    { w: 0.16, h: 0.8, d: 0.58, color: '#4a3a1a', x: 0.64 },
  ]

  return (
    <group position={position} rotation={rotation}>
      {books.map((b, i) => (
        <RoundedBox key={i} args={[b.w, b.h, b.d]} radius={0.01} position={[b.x, b.h / 2, 0]} castShadow>
          <meshStandardMaterial color={b.color} roughness={0.85} />
        </RoundedBox>
      ))}
    </group>
  )
}

/** Caneca de café na mesa. */
function Mug({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.1, 0.28, 20]} />
        <meshStandardMaterial color="#274a3d" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.095, 0.095, 0.02, 20]} />
        <meshStandardMaterial color="#241408" roughness={0.6} />
      </mesh>
      <mesh position={[0.15, 0.15, 0]} rotation-y={Math.PI / 2}>
        <torusGeometry args={[0.07, 0.018, 10, 20]} />
        <meshStandardMaterial color="#274a3d" roughness={0.35} />
      </mesh>
    </group>
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

/** Prateleiras suspensas na parede — hotspot do blog. */
function WallShelves() {
  const shelfBooks = [
    // prateleira de cima: só um par no canto — o porta-retrato é o protagonista
    [
      { w: 0.16, h: 0.5, color: '#2a3a4a', lean: 0 },
      { w: 0.2, h: 0.55, color: '#4a2a20', lean: -0.2 },
    ],
    // prateleira de baixo concentra os livros
    [
      { w: 0.2, h: 0.52, color: '#4a3a1a', lean: 0 },
      { w: 0.16, h: 0.46, color: '#1a3a3a', lean: 0 },
      { w: 0.14, h: 0.48, color: '#2a4a30', lean: 0 },
      { w: 0.18, h: 0.55, color: '#4a1a2a', lean: 0.2 },
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
          {/* livros */}
          {(() => {
            let bx = -1.0
            return shelfBooks[si].map((b, bi) => {
              const x = bx + b.w / 2
              bx += b.w + 0.045
              return (
                <RoundedBox
                  key={bi}
                  args={[b.w, b.h, 0.26]}
                  radius={0.008}
                  position={[x + (b.lean ? 0.05 : 0), 0.035 + b.h / 2 - Math.abs(b.lean) * 0.04, 0]}
                  rotation-z={b.lean}
                  castShadow
                >
                  <meshStandardMaterial color={b.color} roughness={0.85} />
                </RoundedBox>
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
      {/* cubo-troféu na de baixo */}
      <mesh position={[0.85, 0.14, 0]} rotation-y={0.5} castShadow>
        <boxGeometry args={[0.16, 0.16, 0.16]} />
        <meshStandardMaterial color="#f5a623" emissive="#f5a623" emissiveIntensity={0.35} roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  )
}

/* ───────────────────────────────────────────────────────────
   Main Room Component
   ─────────────────────────────────────────────────────────── */

export function Room({ onNavigate, labels = {}, activeView, markers = {} }) {
  const woodTex = useWoodFloorTexture()
  const rugTex = useRugTexture()
  const nightTex = useNightViewTexture()
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
        <meshStandardMaterial color={WALL} roughness={0.95} />
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
      <Books position={[-0.5, 0.1, -4.4]} rotation={[0, 0.25, 0]} />
      <Mug position={[0.55, 0.09, -2.85]} />
      <Notepad position={[5.2, 0.1, -3.1]} rotation={[0, 0.35, 0]} />

      {/* ─── Cozy: velas no parapeito da janela ─── */}
      <CandleCluster position={[-2.55, 1.21, -5.68]} />

      {/* ─── Wall shelves (clicável → blog), à esquerda entre a janela e o PC ─── */}
      <Hotspot
        position={[0.55, 2.62, -5.78]}
        label={labels.shelf}
        labelPosition={[0, -0.85, 0.25]}
        onActivate={() => onNavigate?.('blog')}
        disabled={activeView === 'blog'}
        marker={markers.blog}
      >
        <WallShelves />
        {/* luz de leitura discreta — dá vida ao close do blog */}
        <pointLight position={[0, 0.4, 1.2]} color="#ffd090" intensity={1.6} distance={4} decay={2} />
      </Hotspot>

      {/* ─── Window (panorâmica, maior, atrás do lockup do título) ─── */}
      <group position={[-5.2, 3.4, -5.9]}>
        {/* Outer frame */}
        <RoundedBox args={[8.8, 4.5, 0.2]} radius={0.05} castShadow>
          <meshStandardMaterial color="#2d3340" roughness={0.5} />
        </RoundedBox>
        {/* Night view */}
        <mesh position={[0, 0, 0.11]}>
          <planeGeometry args={[8.2, 3.9]} />
          <meshBasicMaterial map={nightTex} toneMapped={false} />
        </mesh>
        {/* leve reflexo de vidro */}
        <mesh position={[0, 0, 0.12]}>
          <planeGeometry args={[8.2, 3.9]} />
          <meshStandardMaterial
            color="#88aacc"
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
          moldura), levemente torto, com fita adesiva nos cantos ─── */}
      <group position={[3.6, 3.95, -5.965]} rotation-z={-0.028}>
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

      {/* ─── Porta-retrato (clicável → about): em pé, apoiado na prateleira
          de cima, levemente reclinado contra a parede ─── */}
      <Hotspot
        position={[0.85, 3.74, -5.72]}
        rotation-x={-0.07}
        label={labels.painting}
        labelPosition={[0, 0.62, 0.2]}
        onActivate={() => onNavigate?.('about')}
        disabled={activeView === 'about'}
        marker={markers.about}
      >
        {(hovered) => (
          <>
            {/* Frame pequeno, de porta-retrato */}
            <RoundedBox args={[1.06, 0.78, 0.14]} radius={0.025} castShadow>
              <meshStandardMaterial color={hovered ? '#2e2218' : '#1a1510'} roughness={0.7} metalness={0.1} />
            </RoundedBox>
            {/* passe-partout */}
            <mesh position={[0, 0, 0.08]}>
              <planeGeometry args={[0.94, 0.66]} />
              <meshStandardMaterial color="#e8e2d2" roughness={1} />
            </mesh>
            {/* foto: primeira apresentação — a origem do canto musical */}
            <mesh position={[0, 0, 0.09]}>
              <planeGeometry args={[0.86, 0.57]} />
              <meshStandardMaterial map={kidTex} roughness={0.9} />
            </mesh>
          </>
        )}
      </Hotspot>
    </group>
  )
}

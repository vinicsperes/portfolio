import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Flame, Smoke } from './Fire.jsx'
import { VerveTerminal } from './VerveTerminal.jsx'
import './materials.jsx'

const BEIGE = '#d3c9b2'
const BEIGE_DARK = '#c4b99f'
const PLASTIC_DARK = '#22221f'

function Plastic({ color = BEIGE, ...props }) {
  return <meshStandardMaterial color={color} roughness={0.72} metalness={0.05} {...props} />
}

/** Luz laranja tremeluzente que vende o fogo no resto da cena. */
function FireLight({ position, level = 1, dimRef }) {
  const light = useRef()
  const cur = useRef(1)
  useFrame(({ clock }, delta) => {
    const target = level * (1 - (dimRef?.current ?? 0) * 0.92)
    cur.current = THREE.MathUtils.damp(cur.current, target, 2.5, delta)
    const t = clock.elapsedTime
    light.current.intensity =
      (9 + Math.sin(t * 11.3) * 2 + Math.sin(t * 23.7) * 1.4 + Math.sin(t * 5.1) * 1.8) *
      cur.current
  })
  return <pointLight ref={light} position={position} color="#ff7a2a" distance={9} decay={2} />
}

/** Mancha de queimado no topo do monitor. */
function Scorch({ position, scale = 1 }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 128
    const ctx = canvas.getContext('2d')
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 64)
    grad.addColorStop(0, 'rgba(10,8,6,0.95)')
    grad.addColorStop(0.55, 'rgba(20,14,8,0.6)')
    grad.addColorStop(1, 'rgba(20,14,8,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(canvas)
  }, [])

  return (
    <mesh position={position} rotation-x={-Math.PI / 2} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  )
}

function Monitor({ position, view, statsRef, idleText }) {
  return (
    <group position={position}>
      {/* base giratória */}
      <mesh position={[0, 0.07, 0]}>
        <boxGeometry args={[1.7, 0.14, 1.3]} />
        <Plastic color={BEIGE_DARK} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 0.14, 24]} />
        <Plastic color={BEIGE_DARK} />
      </mesh>

      {/* corpo: gabinete frontal + traseira afunilada */}
      <group position={[0, 1.32, 0]}>
        <mesh>
          <boxGeometry args={[2.5, 2.1, 0.7]} />
          <Plastic />
        </mesh>
        <mesh position={[0, -0.02, -0.65]}>
          <boxGeometry args={[2.15, 1.85, 0.7]} />
          <Plastic color={BEIGE_DARK} />
        </mesh>
        <mesh position={[0, -0.06, -1.15]}>
          <boxGeometry args={[1.55, 1.4, 0.45]} />
          <Plastic color={BEIGE_DARK} />
        </mesh>

        {/* moldura interna escura + tela: o verve mora aqui (idle ou live) */}
        <mesh position={[0, 0.08, 0.33]}>
          <boxGeometry args={[2.05, 1.62, 0.08]} />
          <meshStandardMaterial color={PLASTIC_DARK} roughness={0.5} />
        </mesh>
        <group position={[0, 0.08, 0.378]}>
          <VerveTerminal
            mode={view === 'verve' ? 'live' : 'idle'}
            statsRef={statsRef}
            idleText={idleText}
          />
        </group>

        {/* respiros no topo, de onde sai o fogo */}
        {[-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9].map((x) => (
          <mesh key={x} position={[x, 1.06, -0.1]}>
            <boxGeometry args={[0.14, 0.03, 0.5]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
        ))}

        {/* knobs e LED de power */}
        <mesh position={[0.85, -0.88, 0.36]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
          <meshStandardMaterial color={PLASTIC_DARK} roughness={0.4} />
        </mesh>
        <mesh position={[0.6, -0.88, 0.36]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
          <meshStandardMaterial color={PLASTIC_DARK} roughness={0.4} />
        </mesh>
        <mesh position={[-0.85, -0.88, 0.36]}>
          <boxGeometry args={[0.1, 0.05, 0.04]} />
          <meshStandardMaterial color="#ff3b1f" emissive="#ff3b1f" emissiveIntensity={2} />
        </mesh>
      </group>
    </group>
  )
}

function Case() {
  return (
    <group>
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[3.1, 0.76, 2.7]} />
        <Plastic />
      </mesh>
      {/* baias de disquete */}
      <mesh position={[-0.7, 0.55, 1.36]}>
        <boxGeometry args={[1.1, 0.09, 0.03]} />
        <meshStandardMaterial color={PLASTIC_DARK} roughness={0.6} />
      </mesh>
      <mesh position={[-0.7, 0.32, 1.36]}>
        <boxGeometry args={[1.1, 0.09, 0.03]} />
        <meshStandardMaterial color={PLASTIC_DARK} roughness={0.6} />
      </mesh>
      {/* botão de power */}
      <mesh position={[1.1, 0.42, 1.37]}>
        <boxGeometry args={[0.22, 0.22, 0.06]} />
        <Plastic color={BEIGE_DARK} />
      </mesh>
      {/* friso */}
      <mesh position={[0, 0.13, 1.36]}>
        <boxGeometry args={[3.1, 0.04, 0.02]} />
        <meshStandardMaterial color={PLASTIC_DARK} roughness={0.8} />
      </mesh>
    </group>
  )
}

function Keyboard({ position }) {
  const keys = useMemo(() => {
    const list = []
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 13; col++) {
        list.push([-1.08 + col * 0.18, 0, -0.27 + row * 0.18])
      }
    }
    return list
  }, [])

  return (
    <group position={position} rotation-x={-0.06}>
      <mesh>
        <boxGeometry args={[2.5, 0.12, 0.95]} />
        <Plastic color={BEIGE_DARK} />
      </mesh>
      {keys.map(([x, , z], i) => (
        <mesh key={i} position={[x, 0.08, z]}>
          <boxGeometry args={[0.14, 0.06, 0.14]} />
          <Plastic />
        </mesh>
      ))}
      {/* barra de espaço */}
      <mesh position={[0, 0.08, 0.45]}>
        <boxGeometry args={[1.2, 0.06, 0.14]} />
        <Plastic />
      </mesh>
    </group>
  )
}

/**
 * O PC completo: gabinete deitado, monitor CRT em cima pegando fogo,
 * teclado na frente. Origem no chão, centro do gabinete.
 * Em `view='verve'` o fogo acalma (a máquina segura a respiração
 * enquanto você digita) e devolve o drama ao sair.
 */
export function RetroPC({ view, statsRef, idleText, dimRef, ...props }) {
  const monitorTop = 3.15 // altura do topo do monitor
  // dimRef (0..1, dirigido pelo scroll da página) "apaga as luzes" ao sair do hero
  const fireLevel = view === 'verve' ? 0.28 : 1

  return (
    <group {...props}>
      <Case />
      <Monitor position={[0, 0.76, -0.1]} view={view} statsRef={statsRef} idleText={idleText} />

      <Keyboard position={[0, 0.06, 2.15]} />

      {/* fogo saindo dos respiros do monitor */}
      <Flame position={[0, monitorTop - 0.1, -0.2]} scale={1.5} seed={0} level={fireLevel} dimRef={dimRef} />
      <Flame position={[-0.62, monitorTop - 0.08, -0.15]} scale={0.95} intensity={0.85} seed={1} level={fireLevel} dimRef={dimRef} />
      <Flame position={[0.58, monitorTop - 0.08, -0.3]} scale={1.1} intensity={0.8} seed={2} level={fireLevel} dimRef={dimRef} />
      <Flame position={[0.95, monitorTop - 0.5, 0.12]} scale={0.55} intensity={0.65} seed={3} level={fireLevel} dimRef={dimRef} />

      <Scorch position={[0, monitorTop + 0.006, -0.2]} scale={2.4} />
      <Smoke position={[0, monitorTop + 0.5, -0.2]} level={fireLevel} dimRef={dimRef} />
      <FireLight position={[0, monitorTop + 0.7, 0.4]} level={fireLevel} dimRef={dimRef} />
    </group>
  )
}

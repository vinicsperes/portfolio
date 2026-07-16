import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Preload } from '@react-three/drei'
import * as THREE from 'three'
import { PedalScene } from './three/pedal/scene'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

const GREEN = '#16a030'
const palette = {
  pedal: '#1a1a1c',
  ink: '#ffffff',
  accent: GREEN,
  cream: '#f4f0e6',
  metal: '#d4d4d4',
}

// rotação final do chassi ao abrir (só em Y — clipping planes são horizontais)
const OPEN_ANGLE = 1.3
// espera curta antes de abrir, só pra registrar o pedal fechado
const START_DELAY = 0.45

function AutoOpenPedal({ open, reducedMotion }) {
  const group = useRef()
  // a abertura anima por ref (zero re-render por frame): o PedalBody lê
  // explodeRef no próprio useFrame; setState aqui só nos latches (1x cada)
  const explodeRef = useRef(0)
  const smooth = useRef(0)
  const [split, setSplit] = useState(false)
  const [led, setLed] = useState(false)
  const opened = useRef(false)
  const startAt = useRef(0)

  useFrame((state, delta) => {
    // agenda a abertura com um atraso depois que a seção fica visível
    if (open && startAt.current === 0) startAt.current = state.clock.elapsedTime + START_DELAY
    if (startAt.current > 0 && state.clock.elapsedTime >= startAt.current) opened.current = true

    const target = opened.current ? 1 : 0
    smooth.current = reducedMotion ? target : THREE.MathUtils.damp(smooth.current, target, 1.5, delta)
    const p = smooth.current
    explodeRef.current = p * 1.1

    if (!split && p > 0.02) setSplit(true)
    if (!led && p > 0.4) setLed(true)
    if (group.current) group.current.rotation.y = p * OPEN_ANGLE
  })

  return (
    <group ref={group}>
      <PedalScene
        palette={palette}
        explodeRef={explodeRef}
        split={split}
        spin={0}
        hideTag
        ledColor={GREEN}
        ledActive={led}
      />
    </group>
  )
}

/**
 * Canvas contido da seção Ghost: o pedal abre sozinho (com um atraso) quando a
 * seção entra na viewport. `active` pausa o frameloop fora da viewport.
 */
export function SectionPedal({ open = false, active = true }) {
  const reducedMotion = useReducedMotion()
  return (
    <Canvas
      // mais de cima (como no ghostfx): com o chassi aberto dá pra ver o circuito
      camera={{ position: [-0.6, 4.6, 5.6], fov: 40, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.25]}
      frameloop={active ? 'always' : 'never'}
      onCreated={({ gl, camera }) => {
        gl.localClippingEnabled = true
        camera.lookAt(0, 0.2, 0)
      }}
    >
      <ambientLight intensity={0.5} color="#f0e8d8" />
      <directionalLight position={[-4, 6, 3]} intensity={2} color="#e8dfc8" />
      <directionalLight position={[5, 4, -3]} intensity={1.2} color="#c8d8f0" />
      <Suspense fallback={null}>
        <Environment files="/hdri/potsdamer_platz_1k.hdr" environmentIntensity={0.7} />
        <AutoOpenPedal open={open} reducedMotion={reducedMotion} />
        <Preload all />
      </Suspense>
    </Canvas>
  )
}

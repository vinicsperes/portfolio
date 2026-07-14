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

function AutoOpenPedal({ open, reducedMotion }) {
  const group = useRef()
  const smooth = useRef(0)
  const opened = useRef(false)
  const [explode, setExplode] = useState(0)
  const [led, setLed] = useState(false)
  const last = useRef(-1)

  useFrame((_, delta) => {
    // abre sozinho quando a seção entra na viewport, devagarinho (~3s);
    // uma vez aberto, fica aberto (latch). explode máx 1.1 preenche o palco
    if (open) opened.current = true
    const target = opened.current ? 1 : 0
    smooth.current = reducedMotion
      ? target
      : THREE.MathUtils.damp(smooth.current, target, 0.9, delta)
    const p = smooth.current
    if (Math.abs(p - last.current) > 0.002) {
      setExplode(p * 1.1)
      setLed(p > 0.4)
      last.current = p
    }
    if (group.current) {
      // vira de ladinho (~60°) pra mostrar a lateral do chassi
      group.current.rotation.y = p * 1.05
    }
  })

  // NUNCA inclinar o pedal em X/Z: os clipping planes do chassi são
  // horizontais em espaço de mundo — a vista 3/4 vem da câmera (como no ghostfx)
  return (
    <group ref={group} scale={1.14}>
      <PedalScene
        palette={palette}
        explode={explode}
        split={explode > 0.02}
        spin={0}
        hideTag
        ledColor={GREEN}
        ledActive={led}
      />
    </group>
  )
}

/**
 * Canvas contido da seção Ghost (coluna direita do hero da seção): o pedal
 * abre sozinho quando `open` vira true. `active` pausa fora da viewport.
 */
export function SectionPedal({ open = false, active = true }) {
  const reducedMotion = useReducedMotion()
  return (
    <Canvas
      // mais de cima (como no ghostfx): com o chassi aberto dá pra VER o circuito
      camera={{ position: [-0.6, 4.6, 5.6], fov: 40, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
      frameloop={active ? 'always' : 'never'}
      onCreated={({ gl, camera }) => {
        gl.localClippingEnabled = true
        camera.lookAt(0, 0.2, 0)
      }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[-4, 6, 3]} intensity={2.4} color="#e8dfc8" />
      <directionalLight position={[5, 4, -3]} intensity={1.3} color="#c8d8f0" />
      <pointLight position={[0, -2, 4]} intensity={0.8} color="#ffffff" />
      <Suspense fallback={null}>
        <Environment files="/hdri/potsdamer_platz_1k.hdr" environmentIntensity={0.7} />
        <AutoOpenPedal open={open} reducedMotion={reducedMotion} />
        {/* compila tudo no mount (bem antes da seção aparecer) — sem hitch no scroll */}
        <Preload all />
      </Suspense>
    </Canvas>
  )
}

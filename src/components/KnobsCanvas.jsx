import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Float, Preload } from '@react-three/drei'
import { Knob3D } from './three/pedal/knobs'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { HDRI } from '../scene/env.js'

/**
 * Três knobs do pedal, decorativos (a animação de boot ainda roda).
 *
 * Vive em arquivo separado pra virar chunk próprio: em mobile o card usa um
 * still assado no lugar deste canvas, e assim o celular nem chega a baixar os
 * ~88KB da geometria dos knobs.
 */
const LED = '#20f040'
const KNOBS = [
  { label: 'DRIVE', x: -0.55 },
  { label: 'ECHO', x: 0 },
  { label: 'REVERB', x: 0.55 },
]
const KNOB_VALS = [0.72, 0.45, 0.85]
const noop = () => {}

export function KnobsCanvas({ boot }) {
  const reducedMotion = useReducedMotion()
  return (
    <Canvas
      camera={{ position: [0, 1.05, 1.5], fov: 30, near: 0.1, far: 20 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.25]}
      frameloop={boot ? 'always' : 'never'}
      onCreated={({ camera }) => camera.lookAt(0, 0.1, 0)}
    >
      <ambientLight intensity={0.5} color="#f0e8d8" />
      <directionalLight position={[-3, 4, 2]} intensity={2} color="#e8dfc8" />
      <directionalLight position={[3, 3, -2]} intensity={1.2} color="#c8d8f0" />
      <Suspense fallback={null}>
        <Environment files={HDRI} environmentIntensity={0.6} />
        {/* knobs vitrine: assentam nos valores no boot e depois só flutuam;
            sem interação (nada de tooltip/arrasto) */}
        <Float
          speed={reducedMotion ? 0 : 1.5}
          rotationIntensity={reducedMotion ? 0 : 0.15}
          floatIntensity={reducedMotion ? 0 : 0.6}
        >
          {KNOBS.map((k, i) => (
            <Knob3D
              key={k.label}
              position={[k.x, 0, 0]}
              value={KNOB_VALS[i]}
              onChange={noop}
              ink="#e0e0ec"
              accent={LED}
              label={k.label}
              setControlsEnabled={noop}
              bootTrigger={boot ? 1 : 0}
              delay={i * 0.12}
              interactive={false}
            />
          ))}
        </Float>
        {/* frames={1}: sem isso a sombra re-renderiza a cena TODA a cada frame
            (os knobs mal flutuam — ninguém percebe a sombra parada) */}
        <ContactShadows
          position={[0, -0.001, 0]}
          opacity={0.5}
          scale={4}
          blur={2.4}
          far={0.8}
          resolution={256}
          frames={1}
        />
        <Preload all />
      </Suspense>
    </Canvas>
  )
}

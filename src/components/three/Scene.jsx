import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Float, OrbitControls } from '@react-three/drei'
import { RetroPC } from './RetroPC.jsx'

export function Scene() {
  return (
    <Canvas
      camera={{ position: [5.6, 3.3, 9.6], fov: 30 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        {/* luz fria de preenchimento; o quente vem do próprio fogo */}
        <ambientLight intensity={0.4} color="#8890b0" />
        <directionalLight position={[-6, 4, 3]} intensity={1.1} color="#aab4cc" />

        <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.4}>
          <group position={[0, -2.1, 0]} rotation-y={-0.35}>
            <RetroPC />
            <ContactShadows
              position={[0, 0.01, 0]}
              opacity={0.55}
              scale={9}
              blur={2.4}
              far={4}
              color="#000000"
            />
          </group>
        </Float>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.9}
          target={[0, 0.1, 0]}
        />
      </Suspense>
    </Canvas>
  )
}

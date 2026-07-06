import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Float, Grid, OrbitControls } from '@react-three/drei'
import { RetroPC } from './RetroPC.jsx'

const FLOOR_Y = -2.1

export function Scene() {
  return (
    <Canvas
      camera={{ position: [5.6, 3.4, 9.6], fov: 30 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        {/* névoa escura pra grade sumir ao longe */}
        <fog attach="fog" args={['#08080c', 12, 30]} />

        {/* luz fria de preenchimento; o quente vem do próprio fogo */}
        <ambientLight intensity={0.4} color="#8890b0" />
        <directionalLight position={[-6, 4, 3]} intensity={1.1} color="#aab4cc" />

        {/* chão em grade com perspectiva */}
        <Grid
          position={[0, FLOOR_Y, 0]}
          args={[40, 40]}
          cellSize={0.55}
          cellThickness={0.6}
          cellColor="#26262f"
          sectionSize={2.75}
          sectionThickness={1}
          sectionColor="#3a3a48"
          fadeDistance={24}
          fadeStrength={1.5}
          infiniteGrid
        />

        <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.4}>
          <group position={[0, FLOOR_Y, 0]} rotation-y={-0.35}>
            <RetroPC />
            <ContactShadows
              position={[0, 0.01, 0]}
              opacity={0.6}
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
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 0.1, 0]}
        />
      </Suspense>
    </Canvas>
  )
}

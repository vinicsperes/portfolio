import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import { PedalScene } from './three/pedal/scene'

const GREEN = '#16a030'
const palette = {
  pedal: '#1a1a1c',
  ink: '#ffffff',
  accent: GREEN,
  cream: '#f4f0e6',
  metal: '#d4d4d4',
}

/**
 * Câmera de "palco" (portada do ResponsiveCamera do ghostfx): o canvas é
 * full-bleed, mas o pedal é enquadrado no palco à direita do texto via
 * setViewOffset — nada de espremer o pedal numa coluna estreita.
 */
function StageCamera() {
  const { camera, size } = useThree()
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return
    const desktop = size.width >= 768
    const inset = desktop
      ? { left: Math.min(620, size.width * 0.44), top: 40, bottom: 40 }
      : { left: 0, top: 300, bottom: 60 }
    const stageW = size.width - inset.left
    const stageH = size.height - inset.top - inset.bottom
    camera.fov = desktop ? 36 : 46
    camera.aspect = stageW / stageH
    camera.setViewOffset(stageW, stageH, -inset.left, -inset.top, size.width, size.height)
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
}

function ScrollDrivenPedal({ progressRef }) {
  const group = useRef()
  const smooth = useRef(0)
  const [explode, setExplode] = useState(0)
  const last = useRef(-1)

  useFrame((_, delta) => {
    // abre com pouco scroll: chega ao máximo em ~60% da seção
    const target = Math.min(1, (progressRef?.current ?? 0) * 1.7)
    smooth.current = THREE.MathUtils.damp(smooth.current, target, 7, delta)
    const p = smooth.current
    if (Math.abs(p - last.current) > 0.002) {
      setExplode(p * 1.5)
      last.current = p
    }
    if (group.current) {
      group.current.rotation.y = p * Math.PI * 0.6
    }
  })

  // NUNCA inclinar o pedal em X/Z: os clipping planes do chassi são
  // horizontais em espaço de mundo — a vista 3/4 vem da câmera (como no ghostfx)
  return (
    <group ref={group}>
      <PedalScene
        palette={palette}
        explode={explode}
        split={explode > 0.002}
        hideTag
        ledColor={GREEN}
        ledActive={explode > 0.12}
      />
    </group>
  )
}

/**
 * Canvas full-bleed da seção Ghost: o pedal abre conforme o progresso de
 * scroll (progressRef 0..1). `active` pausa o frameloop fora da viewport.
 */
export function SectionPedal({ progressRef, active = true }) {
  return (
    <Canvas
      camera={{ position: [-1.3, 6.0, 4.7], fov: 36, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
      frameloop={active ? 'always' : 'never'}
      onCreated={({ gl, camera }) => {
        gl.localClippingEnabled = true
        camera.lookAt(0, 0.15, 0)
      }}
    >
      <StageCamera />
      <ambientLight intensity={0.55} />
      <directionalLight position={[-4, 6, 3]} intensity={2.4} color="#e8dfc8" />
      <directionalLight position={[5, 4, -3]} intensity={1.3} color="#c8d8f0" />
      <pointLight position={[0, -2, 4]} intensity={0.8} color="#ffffff" />
      <Suspense fallback={null}>
        <Environment preset="apartment" environmentIntensity={0.7} />
        <ScrollDrivenPedal progressRef={progressRef} />
      </Suspense>
    </Canvas>
  )
}

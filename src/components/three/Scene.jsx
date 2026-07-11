import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, PerformanceMonitor, Preload, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { RetroPC } from './RetroPC.jsx'
import { Room } from './Room.jsx'
import { VIEWS, INTRO_START } from '../../scene/hotspots.js'

// escratches reutilizados — nada de alocar por frame
const _pos = new THREE.Vector3()
const _look = new THREE.Vector3()
const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()

function CameraController({ view, reducedMotion }) {
  const { progress } = useProgress()
  const started = useRef(false)
  const introDone = useRef(false)
  const portrait = useRef(false)

  useFrame((state, delta) => {
    // retrato/paisagem com histerese — nada de user-agent
    const aspect = state.size.width / state.size.height
    if (aspect < 0.9) portrait.current = true
    else if (aspect > 1.1) portrait.current = false

    const def = VIEWS[view] ?? VIEWS.home
    const cam = (portrait.current && def.cameraPortrait) || def.camera

    // segura a câmera no waypoint do sweep enquanto os assets carregam
    if (!started.current) {
      if (reducedMotion) {
        state.camera.position.set(...cam.position)
        _look.set(...cam.lookAt)
        state.camera.lookAt(_look)
        started.current = true
        introDone.current = true
      } else if (progress < 100) {
        state.camera.position.set(...INTRO_START.position)
        _look.set(...INTRO_START.lookAt)
        state.camera.lookAt(_look)
        return
      } else {
        started.current = true
      }
    }

    // 1 - Math.exp(-lambda * delta) is the framerate-independent way to lerp
    const lambda = introDone.current ? 4 : 1.4
    const lerpFactor = 1 - Math.exp(-lambda * delta)

    _pos.set(...cam.position)
    _look.set(...cam.lookAt)

    // parallax sutil de mouse no estado home
    if (view === 'home' && introDone.current && !reducedMotion) {
      _pos.x += state.pointer.x * 0.3
      _pos.y += state.pointer.y * 0.15
      _look.x += state.pointer.x * 0.18
      _look.y += state.pointer.y * 0.08
    }

    state.camera.position.lerp(_pos, lerpFactor)
    _m.lookAt(state.camera.position, _look, state.camera.up)
    _q.setFromRotationMatrix(_m)
    state.camera.quaternion.slerp(_q, lerpFactor)

    if (!introDone.current && state.camera.position.distanceTo(_pos) < 0.12) {
      introDone.current = true
    }

    const targetFov = cam.fov ?? 40
    if (Math.abs(state.camera.fov - targetFov) > 0.05) {
      state.camera.fov += (targetFov - state.camera.fov) * lerpFactor
      state.camera.updateProjectionMatrix()
    }
  })
  return null
}

/**
 * A cena enxuta que vive na moldura do hero: quarto (chão, tapete, parede,
 * janela, quadro), mesa com o PC passando o reel. Sem hotspots, sem
 * post-processing, sem fogo — o clima vem da luz e do CRT.
 */
export function Scene({ view, reducedMotion, active = true }) {
  const [dpr, setDpr] = useState(1.1)

  return (
    <Canvas
      camera={{ position: INTRO_START.position, fov: 40 }}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, alpha: true, toneMappingExposure: 1.35 }}
      dpr={dpr}
      shadows
    >
      {/* flipflops limita a 2 oscilações — evita "ticks" visíveis de resolução */}
      <PerformanceMonitor
        flipflops={2}
        onIncline={() => setDpr(1.5)}
        onDecline={() => setDpr(1)}
        onFallback={() => setDpr(1)}
      />
      <CameraController view={view} reducedMotion={reducedMotion} />

      <Suspense fallback={null}>
        {/* névoa quente — funde as bordas distantes do chão na golden hour */}
        <fog attach="fog" args={['#1a1218', 24, 60]} />

        {/* fill ambiente morno e generoso — o quarto não é mais noturno */}
        <ambientLight intensity={1.0} color="#c2b298" />

        {/* sol baixo entrando pela janela (golden hour): quente e direcional */}
        <directionalLight
          position={[-7, 4.5, 2]}
          intensity={1.7}
          color="#ffb266"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={30}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={-0.001}
        />

        {/* feixe quente do pôr do sol pela janela panorâmica */}
        <spotLight
          position={[-4.5, 4, -4]}
          intensity={4.5}
          color="#ffab54"
          distance={18}
          decay={2}
          angle={0.9}
          penumbra={0.6}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
        />

        {/* céu frio de contraponto — impede que fique tudo laranja chapado */}
        <hemisphereLight args={['#9db0d8', '#4a3a2e', 0.4]} />

        {/* O quarto: chão, tapete, parede, janela, quadro do about */}
        <Room />

        {/* RetroPC na mesa passando o reel dos trabalhos */}
        <group position={[3.2, 0, -2.7]} rotation-y={-0.22}>
          <RetroPC />
          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.5}
            scale={9}
            blur={2.4}
            far={4}
            color="#000000"
            frames={1}
          />
        </group>

        {/* compila shaders/texturas ANTES do primeiro frame — o loader só
            libera com a cena pronta de verdade */}
        <Preload all />
      </Suspense>
    </Canvas>
  )
}

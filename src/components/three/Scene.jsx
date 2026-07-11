import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, PerformanceMonitor, Preload, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { RetroPC } from './RetroPC.jsx'
import { Room } from './Room.jsx'
import { GhostPedal } from './GhostPedal.jsx'
import { GuitarAmp } from './GuitarAmp.jsx'
import { VinylCrate } from './VinylCrate.jsx'
import { Hotspot } from './Hotspot.jsx'
import { VIEWS, INTRO_START } from '../../scene/hotspots.js'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'

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
      _pos.x += state.pointer.x * 0.35
      _pos.y += state.pointer.y * 0.18
      _look.x += state.pointer.x * 0.22
      _look.y += state.pointer.y * 0.1
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

export function Scene({ view, scrollRef, statsRef, onNavigate, labels, idleText, reducedMotion, markers, active = true, dimRef }) {
  const [dpr, setDpr] = useState(1.1)
  const showMarkers = view === 'home' && !reducedMotion

  return (
    <Canvas
      camera={{ position: INTRO_START.position, fov: 40 }}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, alpha: true, toneMappingExposure: 1.1, localClippingEnabled: true }}
      onCreated={({ gl }) => {
        // os clipping planes do chassi do pedal dependem disso
        gl.localClippingEnabled = true
      }}
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
        {/* gentle fog — fades distant floor edges */}
        <fog attach="fog" args={['#0a0a0f', 22, 55]} />

        {/* IBL environment for realistic reflections */}
        <Environment files="/hdri/potsdamer_platz_1k.hdr" environmentIntensity={0.15} />

        {/* cool fill light */}
        <ambientLight intensity={0.3} color="#8890b0" />

        {/* main directional (moonlight feel) */}
        <directionalLight
          position={[-6, 6, 3]}
          intensity={0.8}
          color="#aab4cc"
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-camera-far={30}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={-0.001}
        />

        {/* warm light from window */}
        <spotLight
          position={[-4.5, 4, -4]}
          intensity={3}
          color="#6b8caa"
          distance={16}
          decay={2}
          angle={0.8}
          penumbra={0.6}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
        />

        {/* The room: floor, walls, desk, window, painting, shelves, furniture */}
        <Room
          onNavigate={onNavigate}
          labels={labels}
          activeView={view}
          markers={{
            about: showMarkers && markers?.about,
            blog: showMarkers && markers?.blog,
          }}
        />

        {/* RetroPC on the desk — clicável → verve (terminal jogável) */}
        <Hotspot
          position={[3.2, 0, -2.7]}
          rotation-y={-0.22}
          label={labels?.pc}
          labelPosition={[0, 4.5, 0]}
          onActivate={() => onNavigate?.('verve')}
          disabled={view === 'verve'}
          marker={showMarkers && markers?.verve}
        >
          <RetroPC view={view} statsRef={statsRef} idleText={idleText} dimRef={dimRef} />
          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.5}
            scale={9}
            blur={2.4}
            far={4}
            color="#000000"
            frames={1}
          />
        </Hotspot>

        {/* Canto musical: pedal no chão (easter egg: clique = pulso abre-fecha) + amp + vinis */}
        <group position={[-2.35, -1.93, -3.3]} rotation-y={0.45} scale={0.3}>
          <GhostPedal scrollRef={scrollRef} active={view === 'ghost'} />
        </group>
        <GuitarAmp position={[-3.4, -2.1, -4.9]} rotation={[0, 0.35, 0]} />
        <VinylCrate position={[-5.15, -2.1, -3.5]} rotation={[0, 0.75, 0]} />
        <ContactShadows
          position={[-2.9, -2.09, -3.9]}
          opacity={0.55}
          scale={7}
          blur={2.2}
          far={3}
          color="#000000"
          frames={1}
        />
        {/* luz de canto âmbar — dá leitura ao clearcoat do pedal no escuro */}
        <pointLight
          position={[-1.4, -0.5, -2.2]}
          color="#f5a623"
          intensity={2.4}
          distance={7}
          decay={2}
        />

        {/* Post-processing for cinematic realism */}
        <EffectComposer multisampling={2}>
          <Bloom
            luminanceThreshold={0.6}
            luminanceSmoothing={0.4}
            intensity={0.6}
            mipmapBlur
          />
          <Noise opacity={0.025} />
          <Vignette eskil={false} offset={0.15} darkness={0.7} />
        </EffectComposer>

        {/* compila shaders/texturas ANTES do primeiro frame — o loader só
            libera com a cena pronta de verdade */}
        <Preload all />
      </Suspense>
    </Canvas>
  )
}

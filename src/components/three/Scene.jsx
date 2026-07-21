import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, PerformanceMonitor, Preload, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { RetroPC } from './RetroPC.jsx'
import { Room } from './Room.jsx'
import { GuitarAmp } from './GuitarAmp.jsx'
import { VinylCrate } from './VinylCrate.jsx'
import { VIEWS, INTRO_START } from '../../scene/hotspots.js'
import { getLightPreset } from '../../scene/lighting.js'

// resolvido uma vez no load: trocar de preset (?light=) implica reload mesmo
const L = getLightPreset()

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

    // (sem parallax de mouse: a câmera se mexer com o ponteiro enjoava o dono)

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
 * A cena é estática (nada que projeta sombra se move): o shadow map roda em
 * modo manual e este componente o re-renderiza por alguns frames quando um
 * pedaço novo monta (Suspense resolvendo, pedal lazy chegando). Sem isso o
 * passe de sombra re-desenhava ~20 casters em TODO frame, à toa.
 */
function ShadowKick({ frames = 10 }) {
  const { gl } = useThree()
  const left = useRef(frames)
  useFrame(() => {
    if (left.current > 0) {
      gl.shadowMap.needsUpdate = true
      left.current--
    }
  })
  return null
}

/** Dispara quando o conteúdo do Suspense montou (assets carregados de verdade). */
function SceneReady({ onReady }) {
  useEffect(() => {
    onReady?.()
  }, [onReady])
  return null
}

export function Scene({ view, onNavigate, labels, reducedMotion, markers, active = true, dimRef, onReady }) {
  const [dpr, setDpr] = useState(1)
  const showMarkers = view === 'home' && !reducedMotion

  return (
    <Canvas
      camera={{ position: INTRO_START.position, fov: 40 }}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, alpha: true, toneMappingExposure: L.exposure, localClippingEnabled: true }}
      onCreated={({ gl }) => {
        // os clipping planes do chassi do pedal dependem disso
        gl.localClippingEnabled = true
        // sombra em modo manual: o ShadowKick atualiza quando algo monta
        gl.shadowMap.autoUpdate = false
      }}
      dpr={dpr}
      shadows
    >
      {/* flipflops limita a 2 oscilações — evita "ticks" visíveis de resolução */}
      <PerformanceMonitor
        flipflops={2}
        onIncline={() => setDpr(1.25)}
        onDecline={() => setDpr(1)}
        onFallback={() => setDpr(1)}
      />
      <CameraController view={view} reducedMotion={reducedMotion} />

      <Suspense fallback={null}>
        {/* névoa quente — funde as bordas do chão na golden hour */}
        <fog attach="fog" args={[L.fog, 26, 60]} />

        {/* fill ambiente morno e generoso — o quarto não é mais noturno */}
        <ambientLight intensity={L.ambient.intensity} color={L.ambient.color} />

        {/* sol baixo entrando pela janela (golden hour): quente e direcional */}
        <directionalLight
          position={[-7, 4.5, 2]}
          intensity={L.sun.intensity}
          color={L.sun.color}
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

        {/* céu frio de contraponto — impede que fique tudo laranja chapado */}
        <hemisphereLight args={[L.hemi.sky, L.hemi.ground, L.hemi.intensity]} />

        {/* NOTA DE PERF: o feixe (spot) e os 3 point lights de "wash" da parede
            foram removidos. Cada luz custava por PIXEL em toda a cena; a parede
            agora se ilumina sozinha via emissive (L.wallEmissive em Room.jsx) —
            custo zero e resolve inclusive a parede acima da janela no retrato. */}

        {/* The room: floor, walls, desk, window, painting, shelves, furniture */}
        <Room
          onNavigate={onNavigate}
          labels={labels}
          activeView={view}
          markers={{ about: showMarkers && markers?.about }}
        />

        {/* RetroPC na mesa — decorativo: a tela só passa o reel do verve
            (não é mais clicável/jogável) */}
        <group position={[3.2, 0, -4.2]} rotation-y={-0.22}>
          <RetroPC dimRef={dimRef} />
          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.6}
            scale={9}
            blur={2.4}
            far={4}
            color="#000000"
            frames={1}
          />
        </group>

        {/* Canto musical: amp + vinis decorativos (o pedal do chão foi removido
            — perf: um pedal completo em scale 0.3 custava ~116 draw calls/frame
            + uma point light interna, só de enfeite). */}
        <ShadowKick />
        <GuitarAmp position={[-4.5, -2.1, -5.0]} rotation={[0, 0.3, 0]} />
        <VinylCrate position={[-6.2, -2.1, -4.4]} rotation={[0, 0.7, 0]} />
        <ContactShadows
          position={[-3.6, -2.09, -4.2]}
          opacity={0.7}
          scale={7}
          blur={2.2}
          far={3}
          color="#000000"
          frames={1}
        />
        {/* luz de canto âmbar */}
        <pointLight
          position={[-1.4, -0.5, -2.2]}
          color={L.corner.color}
          intensity={L.corner.intensity}
          distance={7}
          decay={2}
        />

        {/* compila shaders/texturas ANTES do primeiro frame — o loader só
            libera com a cena pronta de verdade */}
        <Preload all />
        <SceneReady onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}

import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
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

// rotação máxima do chassi com o pedal totalmente aberto (só em Y — os clipping
// planes são horizontais)
const OPEN_ANGLE = 1.3
// espera curta depois que a seção entra, pra abertura acontecer com o pedal já
// em cena (não no meio da transição de scroll)
const START_DELAY_MS = 700

/**
 * O pedal abre sozinho, uma vez, pouco depois da seção entrar na viewport —
 * desvinculado do scroll. Roda em `frameloop="demand"`: fica idle (custo zero)
 * até a abertura ser agendada, anima renderizando sob demanda e volta a idle
 * assim que assenta aberto.
 */
function AutoOpenPedal({ reducedMotion }) {
  const group = useRef()
  // a abertura anima por ref (zero re-render por frame): o PedalBody lê
  // explodeRef no próprio useFrame; setState aqui só nos latches (split/led)
  const explodeRef = useRef(0)
  const smooth = useRef(0)
  const opened = useRef(false)
  const [split, setSplit] = useState(false)
  const [led, setLed] = useState(false)
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    // sem movimento: já entra aberto e estático
    if (reducedMotion) {
      opened.current = true
      smooth.current = 1
      explodeRef.current = 1.1
      setSplit(true)
      setLed(true)
      invalidate()
      return
    }
    // pinta o pedal FECHADO de forma confiável antes da abertura: o 1º frame do
    // mount pode sair incompleto (texturas/canvas desenhados em effect) e em
    // demand não haveria re-render até o timer — o pedal "surgiria do nada"
    invalidate()
    const warm = [80, 260, 600].map((ms) => setTimeout(invalidate, ms))

    // observa a seção que contém o canvas; agenda a abertura UMA vez ao entrar
    const section = gl.domElement.closest('section') || gl.domElement
    let timer = 0
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1]
        if (e.isIntersecting && !opened.current && !timer) {
          timer = setTimeout(() => {
            opened.current = true
            invalidate() // acorda o loop de abertura
          }, START_DELAY_MS)
          io.disconnect() // abre só uma vez; não precisa mais observar
        }
      },
      { threshold: 0.35 }
    )
    io.observe(section)
    return () => {
      io.disconnect()
      warm.forEach(clearTimeout)
      if (timer) clearTimeout(timer)
    }
  }, [gl, invalidate, reducedMotion])

  useFrame((_, delta) => {
    const target = opened.current ? 1 : 0
    if (reducedMotion) {
      smooth.current = target
    } else {
      // clampa o delta: o 1º frame depois do idle vem com dt enorme (relógio
      // seguiu correndo) e daria um salto na abertura
      const dt = Math.min(delta, 0.033)
      smooth.current = THREE.MathUtils.damp(smooth.current, target, 1.5, dt)
    }
    const p = smooth.current
    explodeRef.current = p * 1.1
    if (group.current) group.current.rotation.y = p * OPEN_ANGLE
    if (!split && p > 0.02) setSplit(true)
    if (!led && p > 0.4) setLed(true)
    // segue renderizando enquanto a abertura não assentou; depois idle
    if (!reducedMotion && Math.abs(target - p) > 0.0005) invalidate()
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
 * Canvas contido da seção Ghost. Showcase: o pointer fica desligado (nenhuma
 * interação de knob/footswitch), o pedal só abre sozinho e permanece aberto.
 */
export function SectionPedal() {
  const reducedMotion = useReducedMotion()
  return (
    <Canvas
      // mais de cima (como no ghostfx): com o chassi aberto dá pra ver o circuito
      camera={{ position: [-0.6, 4.6, 5.6], fov: 40, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.25]}
      frameloop="demand"
      style={{ pointerEvents: 'none' }}
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
        <AutoOpenPedal reducedMotion={reducedMotion} />
        <Preload all />
      </Suspense>
    </Canvas>
  )
}

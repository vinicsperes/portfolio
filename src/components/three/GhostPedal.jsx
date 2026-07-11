import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PedalScene } from './pedal/scene'

const GREEN = '#16a030'
const palette = {
  pedal: '#1a1a1c',
  ink: '#ffffff',
  accent: GREEN,
  cream: '#f4f0e6',
  metal: '#d4d4d4',
}

// pulso do clique portado do ghostfx (App.tsx runExplode): abre, segura e
// fecha enquanto dá uma volta completa
const EXPLODE_MS = 2400
const smoothstep = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x))
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

/**
 * O pedal Ghost como objeto físico do quarto. Easter egg: clicar dispara o
 * pulso abre-fecha girando (igual clicar na logo no ghostfx.app). Na view
 * `ghost`, o scroll (scrollRef 0..1) abre o chassi como antes.
 */
export function GhostPedal({ scrollRef, active }) {
  const group = useRef()
  const [explode, setExplode] = useState(0)
  const smooth = useRef(0)
  const last = useRef(-1)
  const pulse = useRef({ on: false, start: 0 })

  useFrame((_, delta) => {
    if (pulse.current.on) {
      const t = Math.min(1, (performance.now() - pulse.current.start) / EXPLODE_MS)
      const e = t < 0.3 ? smoothstep(t / 0.3) : t < 0.7 ? 1 : 1 - smoothstep((t - 0.7) / 0.3)
      setExplode(e)
      if (group.current) group.current.rotation.y = easeInOut(t) * Math.PI * 2
      if (t >= 1) {
        pulse.current.on = false
        if (group.current) group.current.rotation.y = 0
        setExplode(0)
        smooth.current = 0
        last.current = 0
      }
      return
    }

    const target = active ? (scrollRef?.current?.scroll ?? 0) : 0
    smooth.current = THREE.MathUtils.damp(smooth.current, target, 6, delta)
    const p = smooth.current
    if (Math.abs(p - last.current) > 0.0015) {
      setExplode(p * 1.5)
      last.current = p
    }
    if (group.current) {
      group.current.rotation.y = p * Math.PI * 0.6
    }
  })

  const startPulse = (e) => {
    e.stopPropagation()
    if (active || pulse.current.on) return
    pulse.current = { on: true, start: performance.now() }
  }

  return (
    <group
      ref={group}
      onClick={startPulse}
      onPointerEnter={() => {
        if (!active) document.body.style.cursor = 'pointer'
      }}
      onPointerLeave={() => {
        document.body.style.cursor = ''
      }}
    >
      <PedalScene
        palette={palette}
        explode={explode}
        split={explode > 0.002}
        hideTag
        ledColor={GREEN}
        ledActive={explode > 0.15}
      />
    </group>
  )
}

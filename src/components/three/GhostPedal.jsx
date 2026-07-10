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

/**
 * O pedal Ghost como objeto físico do quarto. Quando a view `ghost` está
 * ativa, o progresso de scroll (0..1) em `scrollRef` abre o chassi e gira
 * o pedal; fora dela o pedal fecha suavemente sozinho.
 */
export function GhostPedal({ scrollRef, active }) {
  const group = useRef()
  const [explode, setExplode] = useState(0)
  const smooth = useRef(0)
  const last = useRef(-1)

  useFrame((_, delta) => {
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

  return (
    <group ref={group}>
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

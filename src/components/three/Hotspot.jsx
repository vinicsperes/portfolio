import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { HoverLabel } from './HoverLabel.jsx'

/** Marcador-pulso âmbar: affordance de descoberta dos hotspots. */
function PulseMarker({ position }) {
  const ring = useRef()
  useFrame(({ clock }) => {
    if (ring.current) ring.current.opacity = 0.4 + Math.sin(clock.elapsedTime * 2.4) * 0.25
  })
  return (
    <Billboard position={position}>
      <mesh>
        <ringGeometry args={[0.09, 0.13, 24]} />
        <meshBasicMaterial ref={ring} color="#f5a623" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.045, 16]} />
        <meshBasicMaterial color="#f5a623" transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </Billboard>
  )
}

/**
 * Grupo clicável da cena: cursor, tooltip, marcador-pulso e ativação num
 * lugar só. `children` pode ser uma função `(hovered) => jsx` para reagir
 * ao hover (ex.: mudar a cor da moldura do quadro).
 */
export function Hotspot({
  label,
  labelPosition,
  onActivate,
  disabled = false,
  marker = false,
  children,
  ...groupProps
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <group
      {...groupProps}
      onClick={(e) => {
        e.stopPropagation()
        if (disabled) return
        // o overlay da view cobre o canvas e o pointerout nunca dispara:
        // sem este reset o cursor ficaria preso em "pointer"
        document.body.style.cursor = 'default'
        onActivate?.()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        if (disabled) return
        setHovered(true)
        if (e.pointerType === 'mouse') document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'default'
      }}
    >
      {typeof children === 'function' ? children(hovered && !disabled) : children}
      {marker && !hovered && !disabled && <PulseMarker position={labelPosition} />}
      {hovered && !disabled && label && <HoverLabel position={labelPosition} text={label} />}
    </group>
  )
}

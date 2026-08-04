import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { HoverLabel } from './HoverLabel.jsx'

const PING_CYCLE = 1.9 // segundos por onda

/**
 * Marcador âmbar dos hotspots: núcleo sólido + DUAS ondas que nascem nele e
 * abrem pra fora, defasadas em meio ciclo (radar). A versão anterior era um
 * anel parado só mudando de opacidade, e piscar no lugar não puxa o olho —
 * movimento pra fora puxa.
 *
 * Tempo próprio em vez de clock.elapsedTime: o R3F zera o relógio quando o
 * frameloop muda (o hero alterna ao sair da viewport) e a onda saltaria no
 * meio do caminho. Mesmo motivo do fogo, em Fire.jsx.
 */
function PulseMarker({ position }) {
  const waves = [useRef(), useRef()]
  const core = useRef()
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += Math.min(delta, 0.1)
    waves.forEach((w, i) => {
      const m = w.current
      if (!m) return
      // fase 0..1; a segunda onda entra meio ciclo depois da primeira
      const p = (t.current / PING_CYCLE + i * 0.5) % 1
      // abre até ~2.7x: a onda precisa passar do tamanho do próprio marcador
      // pra ser percebida de longe, senão continua sendo "bolinha piscando"
      m.scale.setScalar(0.6 + p * 2.1)
      // some antes de chegar na borda, com desaceleração (não é linear)
      m.material.opacity = 0.55 * (1 - p) * (1 - p)
    })
    if (core.current) {
      const b = Math.sin(t.current * 4.2)
      core.current.material.opacity = 0.82 + b * 0.18
      core.current.scale.setScalar(1 + b * 0.09) // respira junto, não só acende
    }
  })

  return (
    <Billboard position={position}>
      {waves.map((w, i) => (
        <mesh key={i} ref={w}>
          <ringGeometry args={[0.075, 0.1, 32]} />
          <meshBasicMaterial color="#f5a623" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      <mesh ref={core}>
        <circleGeometry args={[0.062, 20]} />
        <meshBasicMaterial color="#ffcf6a" transparent opacity={0.9} depthWrite={false} toneMapped={false} />
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

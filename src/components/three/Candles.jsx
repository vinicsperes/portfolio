import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { IS_MOBILE } from '../../scene/deviceTier.js'

/**
 * Vela procedural simples: cera + pavio + chama emissiva. A luz fica no
 * cluster, não por vela.
 */
function Candle({ position = [0, 0, 0], height = 0.28, radius = 0.08, phase = 0 }) {
  const flame = useRef()

  useFrame(({ clock }) => {
    const f = flame.current
    if (!f) return
    const t = clock.elapsedTime
    // tremula: escala e inclinação sutis, cada vela fora de fase
    const w = Math.sin(t * 9 + phase) * 0.5 + Math.sin(t * 15.7 + phase * 2) * 0.5
    f.scale.setScalar(1 + w * 0.12)
    f.rotation.z = w * 0.1
  })

  return (
    <group position={position}>
      {/* cera */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius * 1.06, height, 14]} />
        <meshStandardMaterial color="#efe4cc" roughness={0.65} />
      </mesh>
      {/* pavio */}
      <mesh position={[0, height + 0.012, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.03, 6]} />
        <meshStandardMaterial color="#1a1512" roughness={1} />
      </mesh>
      {/* chama: emissive + toneMapped={false} é o que faz ela "acender" (não há
          bloom na cena). Em mobile ela sobe mais: é o que segura a leitura das
          velas sem a point light do cluster */}
      <group ref={flame} position={[0, height + 0.055, 0]}>
        <mesh>
          <coneGeometry args={[0.028, 0.09, 10]} />
          <meshStandardMaterial
            color="#ffc873"
            emissive="#ff9a2e"
            emissiveIntensity={IS_MOBILE ? 3.4 : 2.6}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <sphereGeometry args={[0.02, 10, 8]} />
          <meshStandardMaterial
            color="#ffe9b8"
            emissive="#ffd27a"
            emissiveIntensity={IS_MOBILE ? 3.8 : 3}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  )
}

/**
 * Trio de velas com UMA luz quente tremulante compartilhada — que em mobile
 * não existe: point light custa por pixel na cena inteira, e o quarto é
 * geometria de tela cheia. Sem ela as chamas seguem acesas (emissive), só o
 * banho quente na mesa em volta some. O useFrame da luz também sai junto.
 */
function ClusterLight() {
  const light = useRef()

  useFrame(({ clock }) => {
    const l = light.current
    if (!l) return
    const t = clock.elapsedTime
    l.intensity = 1.5 + Math.sin(t * 8.3) * 0.18 + Math.sin(t * 13.7) * 0.12
  })

  return (
    <pointLight
      ref={light}
      position={[0, 0.5, 0.15]}
      color="#ffb45e"
      intensity={1.5}
      distance={4.5}
      decay={2}
    />
  )
}

export function CandleCluster({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <Candle position={[0, 0, 0]} height={0.32} radius={0.085} phase={0} />
      <Candle position={[0.22, 0, 0.06]} height={0.2} radius={0.075} phase={2.1} />
      <Candle position={[-0.2, 0, 0.08]} height={0.25} radius={0.065} phase={4.4} />
      {!IS_MOBILE && <ClusterLight />}
    </group>
  )
}

export { Candle }

import { RoundedBox } from '@react-three/drei'

const SLEEVES = ['#8a2b20', '#1e2a3a', '#3a3a30', '#20362a', '#4a2038', '#2a2a2e', '#5e4a20']

/**
 * Caixote de madeira com discos de vinil encostados — compõe o canto
 * musical no lugar da guitarra. Origem na base, no chão.
 */
export function VinylCrate({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* caixote: fundo + 4 laterais */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.82, 0.06, 0.62]} />
        <meshStandardMaterial color="#4a3520" roughness={0.85} />
      </mesh>
      {[
        { p: [0, 0.28, 0.29], a: [0.82, 0.5, 0.04] },
        { p: [0, 0.28, -0.29], a: [0.82, 0.5, 0.04] },
        { p: [0.39, 0.28, 0], a: [0.04, 0.5, 0.62] },
        { p: [-0.39, 0.28, 0], a: [0.04, 0.5, 0.62] },
      ].map((s, i) => (
        <mesh key={i} position={s.p} castShadow>
          <boxGeometry args={s.a} />
          <meshStandardMaterial color="#543a22" roughness={0.85} />
        </mesh>
      ))}
      {/* vinis dentro, levemente inclinados */}
      {SLEEVES.map((c, i) => (
        <RoundedBox
          key={i}
          args={[0.02, 0.56, 0.56]}
          radius={0.004}
          position={[-0.3 + i * 0.09, 0.34, 0]}
          rotation-z={0.06 + (i % 3) * 0.025}
          castShadow
        >
          <meshStandardMaterial color={c} roughness={0.75} />
        </RoundedBox>
      ))}
      {/* um vinil em destaque encostado na lateral */}
      <RoundedBox args={[0.02, 0.6, 0.6]} radius={0.004} position={[0.46, 0.28, 0.05]} rotation-z={-0.28} castShadow>
        <meshStandardMaterial color="#101014" roughness={0.6} />
      </RoundedBox>
    </group>
  )
}

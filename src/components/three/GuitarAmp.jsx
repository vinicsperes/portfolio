import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'

function useGrillTexture() {
  return useMemo(() => {
    const S = 512
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = S
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#141210'
    ctx.fillRect(0, 0, S, S)

    // trama diagonal do grill cloth
    for (let i = -S; i < S * 2; i += 7) {
      ctx.strokeStyle = 'rgba(120,100,70,0.35)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + S, S)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(60,50,35,0.3)'
      ctx.beginPath()
      ctx.moveTo(i + S, 0)
      ctx.lineTo(i, S)
      ctx.stroke()
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(2, 2)
    return tex
  }, [])
}

/**
 * Amplificador combo procedural: gabinete tolex escuro, grill cloth,
 * painel superior com knobs e LED jewel âmbar. Origem no chão.
 */
export function GuitarAmp({ position, rotation = [0, 0, 0] }) {
  const grillTex = useGrillTexture()

  return (
    <group position={position} rotation={rotation}>
      {/* gabinete */}
      <RoundedBox args={[2.4, 2.0, 1.1]} radius={0.06} position={[0, 1.0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1b1613" roughness={0.9} />
      </RoundedBox>

      {/* tela do grill */}
      <mesh position={[0, 0.82, 0.56]}>
        <planeGeometry args={[2.05, 1.35]} />
        <meshStandardMaterial map={grillTex} roughness={0.95} />
      </mesh>
      {/* moldura do grill */}
      <mesh position={[0, 0.82, 0.555]}>
        <planeGeometry args={[2.2, 1.5]} />
        <meshStandardMaterial color="#0d0b09" roughness={0.85} />
      </mesh>

      {/* faixa do painel de controles */}
      <mesh position={[0, 1.78, 0.53]}>
        <boxGeometry args={[2.2, 0.32, 0.08]} />
        <meshStandardMaterial color="#0a0908" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* knobs */}
      {[-0.8, -0.45, -0.1, 0.25, 0.6].map((x) => (
        <mesh key={x} position={[x, 1.78, 0.58]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.07, 0.08, 0.07, 16]} />
          <meshStandardMaterial color="#c9bda4" roughness={0.4} metalness={0.2} />
        </mesh>
      ))}
      {/* LED jewel */}
      <mesh position={[0.95, 1.78, 0.58]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color="#f5a623" emissive="#f5a623" emissiveIntensity={2.4} />
      </mesh>

      {/* alça de couro: dois suportes + barra */}
      {[-0.26, 0.26].map((x) => (
        <mesh key={x} position={[x, 2.02, 0]}>
          <boxGeometry args={[0.05, 0.08, 0.1]} />
          <meshStandardMaterial color="#0d0b09" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      <RoundedBox args={[0.56, 0.05, 0.12]} radius={0.02} position={[0, 2.07, 0]} castShadow>
        <meshStandardMaterial color="#1f1712" roughness={0.75} />
      </RoundedBox>

      {/* pés */}
      {[-0.95, 0.95].map((x) =>
        [-0.4, 0.4].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.03, z]}>
            <cylinderGeometry args={[0.06, 0.07, 0.06, 10]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
          </mesh>
        ))
      )}
    </group>
  )
}

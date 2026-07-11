import { useMemo } from 'react'
import * as THREE from 'three'
import { Instances, Instance } from '@react-three/drei'
import { MonitorReel } from './MonitorReel.jsx'
import './materials.jsx'

const BEIGE = '#d3c9b2'
const BEIGE_DARK = '#c4b99f'
const PLASTIC_DARK = '#22221f'

// materiais compartilhados no módulo: dezenas de meshes, 3 materiais.
// (passados via prop `material`, ficam fora do auto-dispose do R3F — ok,
// vivem a vida toda do app)
const beigeMat = new THREE.MeshStandardMaterial({ color: BEIGE, roughness: 0.72, metalness: 0.05 })
const beigeDarkMat = new THREE.MeshStandardMaterial({ color: BEIGE_DARK, roughness: 0.72, metalness: 0.05 })
const darkPlasticMat = new THREE.MeshStandardMaterial({ color: PLASTIC_DARK, roughness: 0.55 })
const ventMat = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.9 })

function Monitor({ position }) {
  return (
    <group position={position}>
      {/* base giratória */}
      <mesh position={[0, 0.07, 0]} material={beigeDarkMat}>
        <boxGeometry args={[1.7, 0.14, 1.3]} />
      </mesh>
      <mesh position={[0, 0.2, 0]} material={beigeDarkMat}>
        <cylinderGeometry args={[0.55, 0.65, 0.14, 24]} />
      </mesh>

      {/* corpo: gabinete frontal + traseira afunilada */}
      <group position={[0, 1.32, 0]}>
        <mesh material={beigeMat}>
          <boxGeometry args={[2.5, 2.1, 0.7]} />
        </mesh>
        <mesh position={[0, -0.02, -0.65]} material={beigeDarkMat}>
          <boxGeometry args={[2.15, 1.85, 0.7]} />
        </mesh>
        <mesh position={[0, -0.06, -1.15]} material={beigeDarkMat}>
          <boxGeometry args={[1.55, 1.4, 0.45]} />
        </mesh>

        {/* moldura interna escura + tela: o reel dos trabalhos mora aqui */}
        <mesh position={[0, 0.08, 0.33]} material={darkPlasticMat}>
          <boxGeometry args={[2.05, 1.62, 0.08]} />
        </mesh>
        <group position={[0, 0.08, 0.378]}>
          <MonitorReel />
        </group>

        {/* respiros no topo, de onde sai o fogo */}
        {[-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9].map((x) => (
          <mesh key={x} position={[x, 1.06, -0.1]} material={ventMat}>
            <boxGeometry args={[0.14, 0.03, 0.5]} />
          </mesh>
        ))}

        {/* knobs e LED de power */}
        <mesh position={[0.85, -0.88, 0.36]} rotation-x={Math.PI / 2} material={darkPlasticMat}>
          <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
        </mesh>
        <mesh position={[0.6, -0.88, 0.36]} rotation-x={Math.PI / 2} material={darkPlasticMat}>
          <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
        </mesh>
        <mesh position={[-0.85, -0.88, 0.36]}>
          <boxGeometry args={[0.1, 0.05, 0.04]} />
          <meshStandardMaterial color="#ff3b1f" emissive="#ff3b1f" emissiveIntensity={2} />
        </mesh>
      </group>
    </group>
  )
}

function Case() {
  return (
    <group>
      <mesh position={[0, 0.38, 0]} material={beigeMat}>
        <boxGeometry args={[3.1, 0.76, 2.7]} />
      </mesh>
      {/* baias de disquete */}
      <mesh position={[-0.7, 0.55, 1.36]} material={darkPlasticMat}>
        <boxGeometry args={[1.1, 0.09, 0.03]} />
      </mesh>
      <mesh position={[-0.7, 0.32, 1.36]} material={darkPlasticMat}>
        <boxGeometry args={[1.1, 0.09, 0.03]} />
      </mesh>
      {/* botão de power */}
      <mesh position={[1.1, 0.42, 1.37]} material={beigeDarkMat}>
        <boxGeometry args={[0.22, 0.22, 0.06]} />
      </mesh>
      {/* friso */}
      <mesh position={[0, 0.13, 1.36]} material={darkPlasticMat}>
        <boxGeometry args={[3.1, 0.04, 0.02]} />
      </mesh>
    </group>
  )
}

function Keyboard({ position }) {
  const keys = useMemo(() => {
    const list = []
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 13; col++) {
        list.push([-1.08 + col * 0.18, 0, -0.27 + row * 0.18])
      }
    }
    return list
  }, [])

  return (
    <group position={position} rotation-x={-0.06}>
      <mesh material={beigeDarkMat}>
        <boxGeometry args={[2.5, 0.12, 0.95]} />
      </mesh>
      {/* 52 teclas + espaço em UM draw call */}
      <Instances limit={keys.length + 1} material={beigeMat}>
        <boxGeometry args={[0.14, 0.06, 0.14]} />
        {keys.map(([x, , z], i) => (
          <Instance key={i} position={[x, 0.08, z]} />
        ))}
        {/* barra de espaço: mesma geometria, esticada em X */}
        <Instance position={[0, 0.08, 0.45]} scale={[1.2 / 0.14, 1, 1]} />
      </Instances>
    </group>
  )
}

/**
 * O PC completo: gabinete deitado, monitor CRT em cima passando o reel
 * dos trabalhos, teclado na frente. Origem no chão, centro do gabinete.
 */
export function RetroPC(props) {
  return (
    <group {...props}>
      <Case />
      <Monitor position={[0, 0.76, -0.1]} />
      <Keyboard position={[0, 0.06, 2.15]} />
    </group>
  )
}

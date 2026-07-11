import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import './materials.jsx'

/**
 * Labareda: um plano único sempre virado pra câmera (billboard) com o shader
 * de fogo. Várias instâncias em tamanhos/posições diferentes se sobrepõem e
 * dão volume — sem a "cruz" dos planos fixos.
 */
export function Flame({ position = [0, 0, 0], scale = 1, intensity = 1, seed = 0, level = 1, levelRef, dimRef }) {
  const mat = useRef()
  const cur = useRef(1)

  useFrame(({ clock }, delta) => {
    const target = (levelRef?.current ?? level) * (1 - (dimRef?.current ?? 0) * 0.92)
    cur.current = THREE.MathUtils.damp(cur.current, target, 2.5, delta)
    if (mat.current) {
      mat.current.uTime = clock.elapsedTime + seed * 10
      mat.current.uIntensity = intensity * cur.current
    }
  })

  return (
    <Billboard position={position} scale={scale}>
      <mesh position-y={0.62}>
        <planeGeometry args={[1.0, 1.4]} />
        <fireMaterial ref={mat} uIntensity={intensity} />
      </mesh>
    </Billboard>
  )
}

/**
 * Fumaça: pontos subindo com turbulência, esmaecendo com a altura.
 */
export function Smoke({ position = [0, 0, 0], count = 40, height = 2.2, level = 1, levelRef, dimRef }) {
  const points = useRef()
  const cur = useRef(1)

  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 0.4
    positions[i * 3 + 1] = Math.random() * height
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4
    seeds[i] = Math.random()
  }

  useFrame(({ clock }, delta) => {
    const pos = points.current.geometry.attributes.position
    const t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) + delta * (0.35 + seeds[i] * 0.35)
      if (y > height) y = 0
      pos.setY(i, y)
      pos.setX(i, pos.getX(i) + Math.sin(t * 1.2 + seeds[i] * 20) * delta * 0.08)
    }
    pos.needsUpdate = true
    const target = (levelRef?.current ?? level) * (1 - (dimRef?.current ?? 0) * 0.92)
    cur.current = THREE.MathUtils.damp(cur.current, target, 2.5, delta)
    points.current.material.opacity = (0.28 + Math.sin(t * 3) * 0.04) * cur.current
  })

  return (
    <points ref={points} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.28}
        color="#555560"
        transparent
        opacity={0.3}
        depthWrite={false}
        map={smokeSprite()}
        sizeAttenuation
      />
    </points>
  )
}

let cachedSprite = null
function smokeSprite() {
  if (cachedSprite) return cachedSprite
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,0.8)')
  grad.addColorStop(0.4, 'rgba(255,255,255,0.3)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 64, 64)
  cachedSprite = new THREE.CanvasTexture(canvas)
  return cachedSprite
}

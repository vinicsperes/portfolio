import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'

/**
 * Loader minimalista: só barra fina + porcentagem (sem wordmark — o dono
 * não quis o nome aqui), amarrado ao progresso real dos assets 3D.
 */
export function BootLoader({ onDone }) {
  const { progress } = useProgress()
  const [gone, setGone] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (progress >= 100 && !fading) {
      const t = setTimeout(() => setFading(true), 250)
      return () => clearTimeout(t)
    }
  }, [progress, fading])

  useEffect(() => {
    if (!fading) return
    const t = setTimeout(() => {
      setGone(true)
      onDone?.()
    }, 650)
    return () => clearTimeout(t)
  }, [fading, onDone])

  if (gone) return null

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#0a0a0f] transition-opacity duration-700 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      <div className="w-48 sm:w-64 h-px bg-paper/15 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-amber transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="font-mono text-[10px] tracking-[0.3em] text-paper/40">
        {Math.round(progress)}%
      </span>
    </div>
  )
}

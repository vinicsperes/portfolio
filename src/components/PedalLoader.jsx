import { useEffect, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

// só aparece se a espera passar disso: em conexão boa o pedal chega rápido e
// um indicador piscando é pior que palco vazio por um instante
const DELAY_MS = 250
const FADE_MS = 320

/**
 * Espera do palco do pedal. Cobre as três fases em que o palco ficaria vazio:
 * antes de o `belowFold` liberar a montagem, durante o download do chunk do
 * pedal e enquanto o HDRI carrega e os shaders compilam.
 *
 * DOM e CSS puros de propósito: é o intervalo em que a GPU e a main thread
 * estão ocupadas justamente montando o pedal, então o próprio indicador de
 * espera não pode custar nada. O fantasminha é o mesmo do hover do CTA.
 */
export function PedalLoader({ done = false }) {
  const reducedMotion = useReducedMotion()
  const [shown, setShown] = useState(false)
  const [gone, setGone] = useState(false)

  // o cleanup cancela o timer se o pedal chegar antes: nunca chega a aparecer
  useEffect(() => {
    if (done) return
    const t = setTimeout(() => setShown(true), DELAY_MS)
    return () => clearTimeout(t)
  }, [done])

  useEffect(() => {
    if (!done || !shown) return
    const t = setTimeout(() => setGone(true), FADE_MS)
    return () => clearTimeout(t)
  }, [done, shown])

  if (gone || !shown) return null

  return (
    <div
      data-pedal-loader=""
      className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-6 transition-opacity duration-300 ${
        done ? 'opacity-0' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      <svg
        viewBox="13 6 38 52"
        className={`h-14 w-auto sm:h-16 ${reducedMotion ? '' : 'pedal-loader-ghost'}`}
      >
        <path
          d="M16 51 L16 28 C16 16 23 9 32 9 C41 9 48 16 48 28 L48 51 Q44 47 40 51 Q36 55 32 51 Q28 47 24 51 Q20 55 16 51 Z"
          fill="#12161a"
          stroke="#20f040"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
        {/* o ghost de verdade tem um olho só: o LED */}
        <circle cx="36" cy="27" r="9" fill="#41ff77" opacity="0.18" />
        <circle cx="36" cy="27" r="5.5" fill="#41ff77" opacity="0.85" />
      </svg>

      {/* barra indeterminada: não temos progresso real pra prometer */}
      <div className="h-px w-24 overflow-hidden bg-paper/10 sm:w-28">
        <div
          className={
            reducedMotion
              ? 'h-full w-full bg-[#20f040]/30'
              : 'pedal-loader-bar h-full w-1/3 bg-[#20f040]/70'
          }
        />
      </div>
    </div>
  )
}

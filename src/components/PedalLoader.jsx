import { useEffect, useState } from 'react'

// só aparece se a espera passar disso: em conexão boa o pedal chega rápido e
// um indicador piscando é pior que palco vazio por um instante
const DELAY_MS = 250
// saída curta de propósito: quem entra logo atrás é o pedal, e o dono não quer
// os dois na tela ao mesmo tempo. O fade de entrada dele espera este tempo
// (ver o `delay-150` no palco, em Hero.jsx)
const FADE_MS = 150

/**
 * Espera do palco do pedal. Cobre as fases em que o palco ficaria vazio: o
 * download do chunk, o HDRI e a compilação dos shaders.
 *
 * Era um fantasminha grande boiando com uma barra varrendo embaixo. O dono
 * achou feio, e ele ainda ficava por cima do pedal durante a saída. Agora é um
 * anel fino girando, do tamanho de um indicador de carregamento comum, e some
 * antes de o pedal aparecer.
 *
 * DOM e CSS puros de propósito: é o intervalo em que a GPU e a main thread
 * estão ocupadas montando o pedal, então o indicador não pode custar nada.
 */
export function PedalLoader({ done = false }) {
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
      className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${
        done ? 'opacity-0' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      <span className="pedal-spinner" />
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useNearViewport } from '../hooks/useNearViewport.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

const SENTENCES = [
  'speed comes from calm and steady hands',
  'the terminal is home for focused minds',
  'every keystroke counts toward the record',
  'rust keeps the loop tight and honest',
]

const EMBER = '#ff6b2b'

// um caractere por tique; o relógio da corrida anda no mesmo passo
const TICK_MS = 90
const TICK_SECONDS = TICK_MS / 1000

const wpmOf = (chars, time) => Math.min(210, Math.round((chars / 5 / Math.max(time, 0.1)) * 60))

// Quadro parado pra quem pediu menos movimento: a primeira frase inteira, com
// o wpm e o tempo que a digitação teria acumulado até a última letra dela.
const STILL_RUN = {
  idx: 0,
  chars: SENTENCES[0].length,
  time: SENTENCES[0].length * TICK_SECONDS,
  wpm: wpmOf(SENTENCES[0].length, SENTENCES[0].length * TICK_SECONDS),
}

/**
 * Réplica visual do verve real: header "● verve N / M", caixa com a frase
 * se digitando (resto esmaecido), footer "● wpm · tempo". Zero WebGL.
 */
export function VerveDemo() {
  const [, setTick] = useState(0)
  const s = useRef({ idx: 0, chars: 0, wpm: 0, time: 0 })
  // A digitação re-renderiza ~11x por segundo. Sem porteiro isso rodava PARA
  // SEMPRE, inclusive com a seção três telas fora da viewport e com a aba em
  // segundo plano — 11 reconciliações do React por segundo brigando com o
  // scroll inercial do celular. Agora só anda quando está visível de verdade.
  const [ref, near] = useNearViewport('0px')
  const [awake, setAwake] = useState(() => document.visibilityState !== 'hidden')
  // Quem pediu menos movimento não tinha o que pausar aqui: a frase se digitava
  // sozinha, em loop, pra sempre. O resto do site já respeita esse pedido (a
  // moeda do loader, a seta do hero, o pedal abrindo), só esta caixa não.
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const onVisibility = () => setAwake(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    if (reducedMotion || !near || !awake) return
    const id = setInterval(() => {
      const st = s.current
      const sentence = SENTENCES[st.idx]
      if (st.chars < sentence.length) {
        st.chars++
        st.time += TICK_SECONDS
        st.wpm = wpmOf(st.chars, st.time)
      } else {
        st.idx = (st.idx + 1) % SENTENCES.length
        st.chars = 0
        st.time = 0
        st.wpm = 0
      }
      setTick((t) => t + 1)
    }, TICK_MS)
    return () => clearInterval(id)
  }, [near, awake, reducedMotion])

  const { idx, chars, wpm, time } = reducedMotion ? STILL_RUN : s.current
  const sentence = SENTENCES[idx]
  const typed = sentence.slice(0, chars)
  const rest = sentence.slice(chars)

  return (
    <div ref={ref} className="rounded-md bg-[#151518] border border-paper/8 p-8 sm:p-12 shadow-2xl">
      {/* header */}
      <div className="flex items-center gap-3 font-mono text-sm">
        <span className="h-2 w-2 rounded-full" style={{ background: EMBER }} />
        <span className="font-bold text-paper">verve</span>
        <span className="ml-4 text-paper/35">
          {idx + 1} / {SENTENCES.length}
        </span>
      </div>

      {/* caixa da frase */}
      <div className="mt-6 rounded border border-paper/15 px-6 py-8 min-h-36 font-mono text-sm sm:text-base leading-relaxed">
        <span className="text-paper">{typed}</span>
        <span className="border-l-2 border-[#ff6b2b]" aria-hidden="true" />
        <span className="text-paper/30">{rest}</span>
      </div>

      {/* footer */}
      <div className="mt-6 flex items-center justify-center gap-3 font-mono text-sm text-paper/70">
        <span className="h-2 w-2 rounded-full" style={{ background: EMBER }} />
        <span className="text-paper">{wpm} wpm</span>
        <span className="text-paper/30">·</span>
        <span className="text-paper/50">{Math.round(time)}s</span>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'

const SENTENCES = [
  'speed comes from calm and steady hands',
  'the terminal is home for focused minds',
  'every keystroke counts toward the record',
  'rust keeps the loop tight and honest',
]

const EMBER = '#ff6b2b'

/**
 * Réplica visual do verve real: header "● verve N / M", caixa com a frase
 * se digitando (resto esmaecido), footer "● wpm · tempo". Zero WebGL.
 */
export function VerveDemo() {
  const [, setTick] = useState(0)
  const s = useRef({ idx: 0, chars: 0, wpm: 0, time: 0 })

  useEffect(() => {
    const id = setInterval(() => {
      const st = s.current
      const sentence = SENTENCES[st.idx]
      if (st.chars < sentence.length) {
        st.chars++
        st.time += 0.09
        st.wpm = Math.min(210, Math.round((st.chars / 5 / Math.max(st.time, 0.1)) * 60))
      } else {
        st.idx = (st.idx + 1) % SENTENCES.length
        st.chars = 0
        st.time = 0
        st.wpm = 0
      }
      setTick((t) => t + 1)
    }, 90)
    return () => clearInterval(id)
  }, [])

  const { idx, chars, wpm, time } = s.current
  const sentence = SENTENCES[idx]
  const typed = sentence.slice(0, chars)
  const rest = sentence.slice(chars)

  return (
    <div className="rounded-md bg-[#151518] border border-paper/8 p-8 sm:p-12 shadow-2xl">
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

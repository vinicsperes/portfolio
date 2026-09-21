import { useCallback, useEffect, useRef, useState } from 'react'
import { useNearViewport } from '../hooks/useNearViewport.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { useLang } from '../i18n/LanguageContext.jsx'

const SENTENCES = [
  'speed comes from calm and steady hands',
  'the terminal is home for focused minds',
  'every keystroke counts toward the record',
  'rust keeps the loop tight and honest',
]

const EMBER = '#ff6b2b'

// um caractere por tique; o relógio da vitrine anda no mesmo passo
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

const VITRINE = 'vitrine'
const CORRIDA = 'corrida'
const FIM = 'fim'

/**
 * Réplica do verve real que o visitante PODE JOGAR.
 *
 * Ela nasce como vitrine, digitando sozinha em loop (era só isso que existia
 * aqui). No instante em que alguém clica ou tabula até a caixa, a corrida passa
 * a ser dele: as teclas viram os caracteres, cada um acende de acordo com o que
 * era esperado, e o wpm passa a sair do relógio de verdade em vez do relógio
 * simulado.
 *
 * O motivo de existir: o site inteiro mostrava duas coisas interativas atrás do
 * vidro. O pedal tem `pointerEvents: 'none'`, os knobs são uma imagem assada, e
 * isto aqui digitava sozinho na cara do visitante. "Ele diz que fez um teste de
 * digitação" e "eu digitei no teste dele" são portfólios diferentes.
 *
 * Quem recebe as teclas é um <input> transparente por cima da caixa, não um
 * handler de keydown no documento:
 *  - no celular é ele que abre o teclado, coisa que `tabIndex` não faz;
 *  - backspace, seleção e repetição de tecla vêm de graça, do próprio campo;
 *  - e a BARRA DE ESPAÇO não rola a página, porque o input consome ela. Com
 *    listener no documento seria preciso preventDefault em cada espaço, e
 *    qualquer escape rolaria a página no meio da corrida.
 */
export function VerveDemo() {
  const { t } = useLang()
  const d = t.verve.demo
  const reducedMotion = useReducedMotion()
  const [ref, near] = useNearViewport('0px')
  const [awake, setAwake] = useState(() => document.visibilityState !== 'hidden')

  const [modo, setModo] = useState(VITRINE)
  const [idxVivo, setIdxVivo] = useState(0)
  const [digitado, setDigitado] = useState('')
  const [focado, setFocado] = useState(false)
  const [decorrido, setDecorrido] = useState(0)
  const inicioRef = useRef(null)
  const inputRef = useRef(null)

  // ── vitrine: a digitação automática de sempre ──
  const [, setTick] = useState(0)
  const s = useRef({ idx: 0, chars: 0, wpm: 0, time: 0 })

  useEffect(() => {
    const onVisibility = () => setAwake(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    // A vitrine para de vez quando a corrida começa: ela re-renderiza ~11x por
    // segundo e não tem por que seguir rodando por baixo de quem está digitando.
    if (modo !== VITRINE || reducedMotion || !near || !awake) return
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
  }, [modo, near, awake, reducedMotion])

  // ── relógio da corrida do visitante ──
  // Só anda depois da PRIMEIRA tecla, não do foco: clicar na caixa e pensar um
  // pouco antes de começar não pode custar wpm.
  const comecou = digitado.length > 0
  useEffect(() => {
    if (modo !== CORRIDA || !comecou || inicioRef.current == null) return
    const id = setInterval(() => setDecorrido((Date.now() - inicioRef.current) / 1000), 100)
    return () => clearInterval(id)
  }, [modo, comecou])

  // A corrida herda a frase que a vitrine estava mostrando: a troca acontece
  // sem o texto saltar debaixo do cursor.
  const assumir = useCallback(() => {
    setModo((m) => {
      if (m !== VITRINE) return m
      setIdxVivo(reducedMotion ? STILL_RUN.idx : s.current.idx)
      setDigitado('')
      setDecorrido(0)
      inicioRef.current = null
      return CORRIDA
    })
  }, [reducedMotion])

  const proxima = useCallback(() => {
    setIdxVivo((i) => (i + 1) % SENTENCES.length)
    setDigitado('')
    setDecorrido(0)
    inicioRef.current = null
    setModo(CORRIDA)
    inputRef.current?.focus()
  }, [])

  const desistir = useCallback(() => {
    setModo(VITRINE)
    setDigitado('')
    inicioRef.current = null
    inputRef.current?.blur()
  }, [])

  const fraseViva = SENTENCES[idxVivo]

  const aoDigitar = (e) => {
    if (modo === FIM) return
    const v = e.target.value.slice(0, fraseViva.length)
    if (inicioRef.current == null && v.length > 0) inicioRef.current = Date.now()
    setDigitado(v)
    if (v.length === fraseViva.length) {
      setDecorrido((Date.now() - inicioRef.current) / 1000)
      setModo(FIM)
    }
  }

  // ── números mostrados ──
  const vitrineParada = reducedMotion ? STILL_RUN : s.current
  const jogando = modo !== VITRINE
  const certos = jogando ? [...digitado].filter((c, i) => c === fraseViva[i]).length : 0
  const precisao = digitado.length ? Math.round((certos / digitado.length) * 100) : 100
  const wpm = jogando ? wpmOf(certos, decorrido) : vitrineParada.wpm
  const tempo = jogando ? decorrido : vitrineParada.time
  const idxMostrado = jogando ? idxVivo : vitrineParada.idx
  const frase = SENTENCES[idxMostrado]
  const escritos = vitrineParada.chars

  return (
    <div ref={ref} className="rounded-md bg-[#151518] border border-paper/8 p-8 sm:p-12 shadow-2xl">
      {/* header */}
      <div className="flex items-center gap-3 font-mono text-sm">
        <span className="h-2 w-2 rounded-full" style={{ background: EMBER }} />
        <span className="font-bold text-paper">verve</span>
        <span className="ml-4 text-paper/35">
          {idxMostrado + 1} / {SENTENCES.length}
        </span>
        {/* o convite só aparece enquanto ninguém assumiu a caixa */}
        {!jogando && (
          <span className="ml-auto font-mono text-[10px] tracking-[0.2em] text-paper/40">
            {d.hint}
          </span>
        )}
      </div>

      {/* caixa da frase: o input transparente cobre ela inteira, então clicar
          em qualquer ponto começa a corrida */}
      <div
        className={`relative mt-6 rounded border px-6 py-8 min-h-36 font-mono text-sm sm:text-base leading-relaxed transition-colors ${
          focado ? 'border-[#ff6b2b]/70' : 'border-paper/15'
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={jogando ? digitado : ''}
          onChange={aoDigitar}
          onFocus={() => {
            setFocado(true)
            assumir()
          }}
          onBlur={() => setFocado(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') desistir()
            // Enter não submete nada aqui e não deve fazer a página pular
            if (e.key === 'Enter') e.preventDefault()
          }}
          aria-label={d.aria}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="absolute inset-0 h-full w-full cursor-text rounded bg-transparent opacity-0 outline-none"
        />
        {/* VITRINE: três spans, como sempre foi. Sem erro possível aqui, então
            não há por que pagar um span por caractere 11 vezes por segundo. */}
        {!jogando ? (
          <div aria-hidden="true">
            <span className="text-paper">{frase.slice(0, escritos)}</span>
            <span className="border-l-2 border-[#ff6b2b]" />
            <span className="text-paper/30">{frase.slice(escritos)}</span>
          </div>
        ) : (
          /* CORRIDA: um span por caractere, que é o preço de dizer quais
             saíram certos. Erro mostra o caractere ESPERADO em vermelho, não o
             que foi digitado: o texto não reflui debaixo de quem está digitando. */
          <div aria-hidden="true" className="whitespace-pre-wrap">
            {[...frase].map((ch, i) => {
              const cursor = i === digitado.length && modo === CORRIDA
              const errado = i < digitado.length && digitado[i] !== ch
              return (
                <span key={i} className={cursor ? 'border-l-2 border-[#ff6b2b]' : undefined}>
                  <span
                    className={
                      i >= digitado.length
                        ? 'text-paper/30'
                        : errado
                          ? 'bg-red/25 text-red'
                          : 'text-paper'
                    }
                  >
                    {ch}
                  </span>
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* footer: os mesmos números, agora os do visitante quando ele joga */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 font-mono text-sm text-paper/70">
        <span className="h-2 w-2 rounded-full" style={{ background: EMBER }} />
        <span className="text-paper">{wpm} wpm</span>
        <span className="text-paper/30">·</span>
        <span className="text-paper/50">{Math.round(tempo)}s</span>
        {jogando && (
          <>
            <span className="text-paper/30">·</span>
            <span className="text-paper/50">
              {precisao}% {d.accuracy}
            </span>
          </>
        )}
        {modo === FIM && (
          <button
            onClick={proxima}
            className="ml-2 border border-paper/25 px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-paper/80 transition-colors hover:border-[#ff6b2b] hover:text-[#ff6b2b]"
          >
            {d.again}
          </button>
        )}
      </div>

      {/* o resultado da corrida sai por uma região viva: quem usa leitor de
          tela não vê o número aparecer no rodapé */}
      <span className="sr-only" role="status">
        {modo === FIM ? `${wpm} wpm, ${precisao}% ${d.accuracy}` : ''}
      </span>
    </div>
  )
}

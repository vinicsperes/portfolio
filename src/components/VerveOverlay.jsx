import { useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../i18n/LanguageContext.jsx'
import { links } from '../content/index.js'

const sendKey = (key) => window.dispatchEvent(new CustomEvent('verve:key', { detail: { key } }))

export function VerveOverlay({ statsRef, onBack, onSwitch }) {
  const { t, lang } = useLang()
  const v = t.verve
  const [stats, setStats] = useState({ wpm: 0, acc: 100, time: 0, best: 0, finished: false })
  const isCoarse = useMemo(() => window.matchMedia('(pointer: coarse)').matches, [])
  const inputRef = useRef(null)
  const lastVal = useRef('')

  useEffect(() => {
    const id = setInterval(() => {
      if (statsRef?.current) setStats({ ...statsRef.current })
    }, 120)
    return () => clearInterval(id)
  }, [statsRef])

  // teclado virtual (mobile): diff do valor do input oculto → eventos 'verve:key'
  const onHiddenInput = (e) => {
    const val = e.target.value
    const prev = lastVal.current
    if (val.length < prev.length) {
      for (let i = 0; i < prev.length - val.length; i++) sendKey('Backspace')
    } else {
      for (let i = prev.length; i < val.length; i++) sendKey(val[i])
    }
    if (val.length > 200) {
      e.target.value = ''
      lastVal.current = ''
    } else {
      lastVal.current = val
    }
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-6 sm:p-12 pt-24 sm:pt-28">
      {/* top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="pointer-events-auto font-mono text-xs sm:text-sm tracking-widest text-paper hover:text-amber transition-colors flex items-center gap-2"
        >
          {t.ui.backToRoom}
        </button>
        <button
          onClick={onSwitch}
          className="pointer-events-auto font-mono text-xs sm:text-sm tracking-widest text-paper/60 hover:text-[#16a030] transition-colors"
        >
          {t.ui.switchToGhost}
        </button>
      </div>

      {/* left info + live HUD */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mt-auto">
        <div className="pointer-events-auto max-w-md bg-ink-soft/80 p-6 backdrop-blur-md border-l-2 border-[#ff6b2b]">
          <span className="font-mono text-xs font-semibold tracking-[0.2em] text-[#ff6b2b]">
            {v.tag}
          </span>
          <h2 className="mt-2 font-poster text-4xl sm:text-5xl text-paper tracking-tight uppercase leading-none">
            {v.title}
          </h2>
          <p className="font-mono text-xs sm:text-sm text-paper/70 leading-relaxed mt-4">{v.p1}</p>
          <p className="font-mono text-[11px] text-paper/50 leading-relaxed mt-4">
            {v.p2Prefix}
            <span className="text-paper/80">ratatui</span> &amp;
            <span className="text-paper/80"> crossterm</span>
            {v.p2Suffix}
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <a
              href={links.verveSource}
              target="_blank"
              rel="noreferrer"
              className="inline-block w-fit border border-[#ff6b2b] text-[#ff6b2b] px-5 py-3 font-mono text-xs font-bold hover:bg-[#ff6b2b] hover:text-[#0a0a0f] transition-colors"
            >
              {v.source}
            </a>
            {isCoarse ? (
              <div className="flex gap-3">
                <button
                  onClick={() => inputRef.current?.focus()}
                  className="border border-paper/40 text-paper px-4 py-2 font-mono text-[10px] font-bold tracking-widest"
                >
                  {lang === 'pt' ? 'TOCAR PARA DIGITAR' : 'TAP TO TYPE'}
                </button>
                <button
                  onClick={() => sendKey('Tab')}
                  className="border border-paper/20 text-paper/60 px-4 py-2 font-mono text-[10px] font-bold tracking-widest"
                >
                  {lang === 'pt' ? 'REINICIAR' : 'RESTART'}
                </button>
              </div>
            ) : (
              <span className="font-mono text-[10px] tracking-widest text-paper/40">
                {v.liveHint}
              </span>
            )}
            {/* input invisível: abre o teclado virtual em touch */}
            <input
              ref={inputRef}
              onInput={onHiddenInput}
              className="absolute h-px w-px opacity-0"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>
        </div>

        {/* live stats mirrored from the terminal */}
        <div className="pointer-events-auto self-start sm:self-auto flex gap-3">
          {[
            { label: v.stats.wpm, value: stats.wpm, color: '#4dff7c' },
            { label: v.stats.acc, value: `${stats.acc}%`, color: '#9be8b4' },
            { label: v.stats.time, value: `${stats.time.toFixed(1)}s`, color: '#f5a623' },
            { label: v.stats.best, value: stats.best, color: '#5ad1ff' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-ink-soft/80 backdrop-blur-md border border-paper/10 px-4 py-3 text-center min-w-[64px]"
            >
              <div className="font-poster text-2xl leading-none" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="font-mono text-[9px] tracking-widest text-paper/50 mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

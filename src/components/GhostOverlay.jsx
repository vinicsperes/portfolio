import { useEffect, useRef } from 'react'
import { useLang } from '../i18n/LanguageContext.jsx'
import { links } from '../content/index.js'
import { useReveal } from '../hooks/useReveal.js'

const GREEN = '#16a030'

const revealCls = (visible) =>
  `transition-all duration-700 ease-out ${
    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
  }`

export function GhostOverlay({ scrollRef, onBack, onSwitch }) {
  const { t } = useLang()
  const g = t.ghost
  const scrollEl = useRef(null)
  const [r1, v1] = useReveal()
  const [r2, v2] = useReveal()
  const [r3, v3] = useReveal()
  const [r4, v4] = useReveal()

  useEffect(() => {
    const el = scrollEl.current
    if (el) el.scrollTop = 0
    if (scrollRef) scrollRef.current.scroll = 0
  }, [scrollRef])

  const onScroll = (e) => {
    const el = e.currentTarget
    const max = el.scrollHeight - el.clientHeight
    const p = max > 0 ? el.scrollTop / max : 0
    if (scrollRef) scrollRef.current.scroll = p
  }

  return (
    <div
      ref={scrollEl}
      onScroll={onScroll}
      className="pointer-events-auto absolute inset-0 z-20 overflow-y-auto overflow-x-hidden overscroll-contain"
    >
      {/* sticky top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-6 sm:px-12 py-5 mt-16 bg-gradient-to-b from-[#0a0a0f]/90 to-transparent">
        <button
          onClick={onBack}
          className="font-mono text-xs sm:text-sm tracking-widest text-paper hover:text-amber transition-colors flex items-center gap-2"
        >
          {t.ui.backToRoom}
        </button>
        <button
          onClick={onSwitch}
          className="font-mono text-xs sm:text-sm tracking-widest text-paper/60 hover:text-[#ff6b2b] transition-colors"
        >
          {t.ui.switchToVerve}
        </button>
      </div>

      {/* PAGE 1 */}
      <section className="min-h-[100vh] flex flex-col justify-center px-6 sm:px-12 lg:px-24">
        <div ref={r1} className={`max-w-md xl:max-w-lg pointer-events-none ${revealCls(v1)}`}>
          <span className="font-mono text-xs font-semibold tracking-[0.2em]" style={{ color: GREEN }}>
            {g.tag}
          </span>
          <h1 className="font-poster text-[16vw] sm:text-[10vw] xl:text-[8vw] text-paper uppercase leading-none select-none tracking-tighter -ml-1">
            {g.title}
          </h1>
          <h2 className="font-mono text-base xl:text-xl tracking-widest text-paper font-bold mt-2">
            {g.subtitle}
          </h2>
          <p className="font-mono text-xs xl:text-sm text-paper/70 leading-relaxed mt-4">
            {g.intro}
          </p>
          <p className="font-mono text-[10px] tracking-widest font-bold mt-10" style={{ color: GREEN }}>
            {g.scrollHint}
          </p>
        </div>
      </section>

      {/* PAGE 2 */}
      <section className="min-h-[100vh] flex flex-col justify-center px-6 sm:px-12 lg:px-24">
        <div
          ref={r2}
          className={`max-w-md xl:max-w-lg pointer-events-none bg-ink-soft/70 p-6 rounded-xl backdrop-blur-md border border-paper/10 ${revealCls(v2)}`}
        >
          <h2 className="font-poster text-3xl xl:text-4xl text-paper uppercase">{g.underHood.title}</h2>
          <p className="mt-3 font-mono text-paper/70 text-xs leading-relaxed">
            {g.underHood.p1}
            <br />
            <br />
            {g.underHood.p2}
          </p>
          <div
            className="mt-4 inline-block px-3 py-1 rounded border"
            style={{ background: `${GREEN}1a`, borderColor: `${GREEN}4d` }}
          >
            <span className="font-bold tracking-widest text-[10px]" style={{ color: GREEN }}>
              {g.underHood.badge}
            </span>
          </div>
        </div>
      </section>

      {/* PAGE 3 */}
      <section className="min-h-[100vh] flex flex-col justify-center px-6 sm:px-12 lg:px-24">
        <div ref={r3} className={`max-w-md xl:max-w-lg pointer-events-none ${revealCls(v3)}`}>
          <h2 className="font-poster text-3xl xl:text-4xl text-paper uppercase">{g.presets.title}</h2>
          <p className="mt-3 font-mono text-paper/70 text-xs leading-relaxed">{g.presets.p}</p>
          <ul className="mt-4 font-mono text-[11px] text-paper/80 space-y-1">
            {g.presets.list.map((p) => (
              <li key={p.name}>
                <span style={{ color: GREEN }}>{p.name}</span> — {p.desc}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PAGE 4 */}
      <section className="min-h-[100vh] flex flex-col justify-center px-6 sm:px-12 lg:px-24">
        <div ref={r4} className={`max-w-md xl:max-w-lg pointer-events-none flex flex-col gap-4 ${revealCls(v4)}`}>
          <h2
            className="font-poster text-[12vw] sm:text-[8vw] xl:text-[5vw] uppercase leading-none"
            style={{ color: GREEN }}
          >
            {g.ready.title}
          </h2>
          <a
            href={links.ghostApp}
            target="_blank"
            rel="noreferrer"
            className="pointer-events-auto w-fit border-2 border-[#16a030] text-[#0a0a0f] bg-[#16a030] px-6 py-4 font-mono text-sm font-bold hover:bg-transparent hover:text-[#16a030] transition-colors"
          >
            {g.ready.play}
          </a>
          <a
            href={links.ghostSource}
            target="_blank"
            rel="noreferrer"
            className="pointer-events-auto w-fit border-2 border-paper/30 text-paper px-6 py-4 font-mono text-sm font-bold hover:border-paper hover:bg-paper/10 transition-colors"
          >
            {g.ready.source}
          </a>
        </div>
      </section>
    </div>
  )
}

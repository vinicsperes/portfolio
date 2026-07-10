import { useEffect, useMemo, useRef, useState } from 'react'
import { Scene } from './three/Scene.jsx'
import { GhostOverlay } from './GhostOverlay.jsx'
import { VerveOverlay } from './VerveOverlay.jsx'
import { BootLoader } from './BootLoader.jsx'
import { NavMenu } from './NavMenu.jsx'
import { StaticFallback } from './StaticFallback.jsx'
import { SectionPedal } from './SectionPedal.jsx'
import { VerveDemo } from './VerveDemo.jsx'
import { useLang } from '../i18n/LanguageContext.jsx'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { useReveal } from '../hooks/useReveal.js'
import { useNearViewport } from '../hooks/useNearViewport.js'
import { useSectionProgress } from '../hooks/useSectionProgress.js'
import { links, skills } from '../content/index.js'

// views com câmera própria: só os demos jogáveis; o resto vira âncora de seção
const VALID_VIEWS = ['home', 'ghost', 'verve']
const SECTION_TARGETS = ['about', 'blog', 'contact']
const SEEN_KEY = 'vp.seen'
const GREEN = '#16a030'
const EMBER = '#ff6b2b'

function initialView() {
  const v = new URLSearchParams(window.location.search).get('view')
  return VALID_VIEWS.includes(v) ? v : 'home'
}

function loadSeen() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}')
  } catch {
    return {}
  }
}

function supportsWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function RevealBlock({ children, className = '' }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function Hero() {
  const { lang, setLang, t } = useLang()
  const reducedMotion = useReducedMotion()
  const webgl = useMemo(supportsWebGL, [])
  const [view, setView] = useState(initialView) // home | about | ghost | verve | contact | blog
  const [seen, setSeen] = useState(loadSeen)
  const [copied, setCopied] = useState(false)

  const scrollRef = useRef({ scroll: 0 })
  const verveStatsRef = useRef({ wpm: 0, acc: 100, time: 0, best: 0, finished: false })

  // pausa o canvas do hero fora da viewport; monta/pausa o canvas do pedal da seção
  const [heroRef, heroNear] = useNearViewport('200px')
  const [ghostNearRef, ghostNear] = useNearViewport('600px')
  const [ghostProgressRef, ghostProgress] = useSectionProgress()

  // "apagar as luzes": 0 no topo → 1 quando o hero sai da tela (dirige o fogo)
  const dimRef = useRef(0)
  useEffect(() => {
    const onScroll = () => {
      dimRef.current = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.85)))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const markSeen = (v) => {
    setSeen((s) => {
      if (s[v]) return s
      const next = { ...s, [v]: true }
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify(next))
      } catch {
        /* private mode */
      }
      return next
    })
  }

  const navigate = (v) => {
    // quadro/estante/telefone: atalhos que rolam para a seção correspondente
    if (SECTION_TARGETS.includes(v)) {
      markSeen(v)
      document.getElementById(v)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
      return
    }
    if (v === 'ghost') scrollRef.current.scroll = 0
    if (v !== 'home') markSeen(v)
    setView(v)
  }

  const openInScene = (v) => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
    navigate(v)
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(links.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard indisponível */
    }
  }

  // deep-link para seções (#ghost, #about…): rola após o layout assentar
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return
    const tm = setTimeout(() => document.getElementById(id)?.scrollIntoView(), 500)
    return () => clearTimeout(tm)
  }, [])

  // Escape volta ao quarto de qualquer view
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') navigate('home')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!webgl) return <StaticFallback />

  const markers = {
    about: !seen.about,
    ghost: !seen.ghost,
    verve: !seen.verve,
    contact: !seen.contact,
    blog: !seen.blog,
  }
  const anySeen = Object.keys(seen).length > 0

  const socials = [
    { label: 'GH', href: links.github },
    { label: 'IN', href: links.linkedin },
    ...(links.cv ? [{ label: 'CV', href: links.cv }] : []),
  ]

  // delayCls deve ser classe literal (ex.: 'delay-150') — Tailwind não vê interpolação
  const reveal = (active, delayCls = '') =>
    `transition-all duration-700 ease-out ${
      active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    } ${delayCls}`

  return (
    <div className="relative w-full bg-[#0a0a0f] text-paper">
      {/* resumo para leitores de tela — a cena 3D é decorativa/navegável por menu */}
      <p className="sr-only">
        Vinicius Peres — fullstack creative developer. Ghost FX: guitar pedal in the browser.
        Verve: terminal typing test. Use the navigation menu to explore.
      </p>

      {/* Topbar fixa */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between gap-4 p-6 sm:px-12 sm:py-8 bg-gradient-to-b from-[#0a0a0f]/70 to-transparent">
        <button
          onClick={() => {
            navigate('home')
            window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
          }}
          className="pointer-events-auto flex items-center gap-3 text-left"
          aria-label={lang === 'pt' ? 'Voltar ao início' : 'Back to start'}
        >
          <div className="h-8 w-8 bg-paper mix-blend-difference" />
          <span className="font-mono text-sm font-bold tracking-[0.2em] text-paper mix-blend-difference">
            VINICIUS
            <br />
            PERES
          </span>
        </button>

        <div className="pointer-events-auto flex items-center gap-5">
          <NavMenu />
          <div
            className="flex items-center gap-2 font-mono text-xs tracking-widest"
            role="group"
            aria-label="Language"
          >
            {['pt', 'en'].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`px-1 transition-colors ${
                  lang === l ? 'text-amber' : 'text-paper/50 hover:text-paper'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────── HERO: a cena 3D ─────────── */}
      <section ref={heroRef} className="relative h-[100dvh] overflow-hidden">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <Scene
            view={view}
            scrollRef={scrollRef}
            statsRef={verveStatsRef}
            onNavigate={navigate}
            labels={t.labels}
            idleText={t.verve.idle}
            reducedMotion={reducedMotion}
            markers={markers}
            active={heroNear}
            dimRef={dimRef}
          />
        </div>

        <BootLoader />

        {/* Home overlay — lockup tipográfico sobre a janela */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute left-[4%] sm:left-[6%] top-[12%]">
            <p
              className={`font-accent italic text-3xl sm:text-5xl text-amber ${reveal(
                view === 'home'
              )}`}
            >
              {t.hero.titleTop}
            </p>
            <h1
              className={`font-poster uppercase leading-[0.85] tracking-tight text-paper text-[15vw] sm:text-[10vw] lg:text-[8.5vw] drop-shadow-[0_6px_28px_rgba(0,0,0,0.65)] ${reveal(
                view === 'home',
                'delay-150'
              )}`}
            >
              Vinícius
              <br />
              <span className="text-stroke-paper">Peres</span>
            </h1>
            <p
              className={`mt-4 font-mono text-[10px] sm:text-xs tracking-[0.35em] text-paper/70 ${reveal(
                view === 'home',
                'delay-300'
              )}`}
            >
              {t.hero.tag}
            </p>
          </div>

          {/* hint + socials */}
          {!anySeen && (
            <p
              className={`absolute bottom-6 left-6 sm:left-12 font-mono text-[10px] tracking-widest text-paper/40 ${reveal(
                view === 'home',
                'delay-500'
              )}`}
            >
              {t.hero.hint}
            </p>
          )}
          <div
            className={`absolute bottom-6 right-6 sm:right-12 flex items-center gap-6 ${
              view === 'home' ? 'pointer-events-auto' : ''
            } ${reveal(view === 'home', 'delay-300')}`}
          >
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="font-mono text-xs tracking-widest text-paper hover:text-amber transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                {s.label}
              </a>
            ))}
          </div>

          {/* hint de scroll */}
          <div
            className={`absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 ${reveal(
              view === 'home',
              'delay-500'
            )}`}
          >
            <span className="font-mono text-[9px] tracking-[0.3em] text-paper/40">
              {t.ui.scrollHint}
            </span>
            <span
              className={`text-paper/40 text-xs ${reducedMotion ? '' : 'animate-bounce'}`}
              aria-hidden="true"
            >
              ↓
            </span>
          </div>
        </div>

        {/* Views da cena */}
        {view === 'ghost' && (
          <GhostOverlay
            key="ghost"
            scrollRef={scrollRef}
            onBack={() => navigate('home')}
            onSwitch={() => navigate('verve')}
          />
        )}
        {view === 'verve' && (
          <VerveOverlay
            key="verve"
            statsRef={verveStatsRef}
            onBack={() => navigate('home')}
            onSwitch={() => navigate('ghost')}
          />
        )}
      </section>

      {/* ─────────── PÁGINA: seções roláveis ─────────── */}
      <main className="relative z-10 border-t border-paper/10">
        {/* Sobre — headline gigante + retrato halftone + marquee de skills */}
        <section id="about" className="relative overflow-hidden">
          {/* grid editorial: foto à esquerda, texto à direita — sem truques */}
          <div className="mx-auto max-w-6xl px-6 sm:px-12 pt-24 sm:pt-32 pb-20">
            <RevealBlock className="grid items-center gap-12 md:grid-cols-[auto_1fr] lg:gap-20">
              <figure className="mx-auto md:mx-0">
                <img
                  src="/img/vini-halftone.webp"
                  alt={lang === 'pt' ? 'Retrato de Vinícius em meio-tom' : 'Halftone portrait of Vinícius'}
                  className="w-56 rotate-[-3deg] transition-transform duration-500 hover:rotate-0 lg:w-72"
                />
                <figcaption className="mx-auto mt-3 w-fit border border-paper/25 px-3 py-1.5 font-mono text-[9px] tracking-[0.25em] text-paper/50">
                  VINICIUS PERES · BR © {new Date().getFullYear()}
                </figcaption>
              </figure>

              <div>
                <span className="font-mono text-xs font-semibold tracking-[0.3em] text-amber">
                  {t.sections.about}
                </span>
                <h2 className="mt-4 font-poster uppercase leading-[0.95] text-paper text-4xl sm:text-5xl lg:text-6xl">
                  {t.about.calloutTop}{' '}
                  <span className="font-accent italic normal-case text-amber text-5xl sm:text-7xl lg:text-8xl align-middle whitespace-nowrap">
                    {t.about.nickname}
                  </span>
                </h2>
                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  <p className="font-mono text-sm text-paper/75 leading-relaxed">{t.about.p1}</p>
                  <p className="font-mono text-sm text-paper/75 leading-relaxed">{t.about.p2}</p>
                </div>
              </div>
            </RevealBlock>
          </div>

          {/* faixa marquee de skills */}
          <div className="border-y border-paper/10 py-4 overflow-hidden" aria-hidden="true">
            <div className="marquee-track flex w-max items-center gap-10 font-poster text-2xl sm:text-4xl uppercase text-paper/60">
              {[...skills, ...skills].map((s, i) => (
                <span key={i} className="flex items-center gap-10">
                  {s}
                  <span className="text-amber text-xl">✦</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* GHOST FX — sticky full-bleed: o pedal abre com o scroll no palco à direita */}
        <section id="ghost" ref={ghostNearRef} className="relative">
          <div ref={ghostProgressRef} className="h-[220vh]">
            <div className="sticky top-0 h-screen overflow-hidden">
              <div
                className="absolute inset-0"
                style={{ background: 'radial-gradient(55% 55% at 68% 50%, rgba(22,160,48,0.08), transparent 70%)' }}
              />

              {/* canvas full-bleed: a StageCamera desloca o pedal para a direita */}
              <div className="absolute inset-0">
                {ghostNear && <SectionPedal progressRef={ghostProgress} active={ghostNear} />}
              </div>

              {/* texto sobre o palco esquerdo */}
              <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-6 sm:px-12">
                <div className="pointer-events-auto max-w-md">
                  <span className="font-mono text-xs font-semibold tracking-[0.25em]" style={{ color: GREEN }}>
                    {t.ghost.tag}
                  </span>
                  <h2 className="mt-3 font-poster uppercase leading-[0.85] text-6xl sm:text-8xl">
                    <span className="text-paper">GHOST</span>
                    <br />
                    <span className="text-stroke-green">FX</span>
                  </h2>
                  <p className="mt-4 font-mono text-sm font-bold tracking-widest text-paper">
                    {t.ghost.subtitle}
                  </p>
                  <p className="mt-4 font-mono text-xs sm:text-sm text-paper/70 leading-relaxed">
                    {t.ghost.intro}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2" aria-hidden="true">
                    {t.ghost.presets.list.map((p) => (
                      <span
                        key={p.name}
                        className="border px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest"
                        style={{ borderColor: `${GREEN}55`, color: GREEN }}
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <a
                      href={links.ghostApp}
                      target="_blank"
                      rel="noreferrer"
                      className="border-2 px-5 py-3 font-mono text-xs font-bold transition-colors"
                      style={{ borderColor: GREEN, background: GREEN, color: '#0a0a0f' }}
                    >
                      {t.ghost.ready.play}
                    </a>
                    <button
                      onClick={() => openInScene('ghost')}
                      className="border border-amber text-amber px-5 py-3 font-mono text-xs font-bold hover:bg-amber hover:text-ink transition-colors"
                    >
                      {t.ui.openInScene}
                    </button>
                    <a
                      href={links.ghostSource}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-paper/25 text-paper/80 px-5 py-3 font-mono text-xs font-bold hover:border-paper hover:text-paper transition-colors"
                    >
                      {t.ghost.ready.source}
                    </a>
                  </div>
                </div>
              </div>

              <p
                className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 font-mono text-[10px] tracking-[0.3em]"
                style={{ color: GREEN }}
              >
                {t.ghost.scrollHint}
              </p>
            </div>
          </div>
        </section>

        {/* VERVE — terminal vivo */}
        <section id="verve" className="relative border-t border-paper/10 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(55% 55% at 30% 50%, rgba(255,107,43,0.07), transparent 70%)' }}
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 sm:px-12 py-24 sm:py-32 md:grid-cols-2">
            <RevealBlock className="order-2 md:order-1">
              <VerveDemo />
            </RevealBlock>
            <RevealBlock className="order-1 md:order-2">
              <span className="font-mono text-xs font-semibold tracking-[0.25em]" style={{ color: EMBER }}>
                {t.verve.tag}
              </span>
              <h2 className="mt-3 font-poster uppercase leading-[0.85] text-6xl sm:text-8xl lg:text-9xl">
                <span className="text-stroke-ember">VER</span>
                <span className="text-paper">VE</span>
              </h2>
              <p className="mt-5 max-w-md font-mono text-xs sm:text-sm text-paper/70 leading-relaxed">
                {t.verve.p1}
              </p>
              <p className="mt-3 font-mono text-[11px] text-paper/50 leading-relaxed">
                {t.verve.p2Prefix}
                <span className="text-paper/80">ratatui</span> &amp;
                <span className="text-paper/80"> crossterm</span>
                {t.verve.p2Suffix}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={() => openInScene('verve')}
                  className="border border-amber text-amber px-5 py-3 font-mono text-xs font-bold hover:bg-amber hover:text-ink transition-colors"
                >
                  {t.ui.openInScene}
                </button>
                <a
                  href={links.verveSource}
                  target="_blank"
                  rel="noreferrer"
                  className="border px-5 py-3 font-mono text-xs font-bold transition-colors"
                  style={{ borderColor: EMBER, color: EMBER }}
                >
                  {t.verve.source}
                </a>
              </div>
            </RevealBlock>
          </div>
        </section>

        {/* Blog */}
        <section id="blog" className="border-t border-paper/10">
          <div className="mx-auto max-w-6xl px-6 sm:px-12 py-24 sm:py-32">
            <span className="font-mono text-xs font-semibold tracking-[0.3em] text-amber">
              {t.sections.blog}
            </span>
            <RevealBlock>
              <h2 className="mt-4 font-poster uppercase leading-[0.9] text-[13vw] sm:text-8xl lg:text-9xl text-stroke-paper">
                {t.blog.soon}
              </h2>
              <p className="mt-6 max-w-xl font-mono text-sm text-paper/70 leading-relaxed">
                {t.blog.soonSub}
              </p>
            </RevealBlock>
          </div>
        </section>

        {/* Contato */}
        <section id="contact" className="border-t border-paper/10">
          <div className="mx-auto max-w-6xl px-6 sm:px-12 py-24 sm:py-32">
            <span className="font-mono text-xs font-semibold tracking-[0.3em] text-amber">
              {t.sections.contact}
            </span>
            <RevealBlock>
              <h2 className="mt-4 font-poster uppercase leading-none text-4xl sm:text-6xl text-paper">
                {t.contact.titleTop} {t.contact.titleBottom}
              </h2>
              <p className="mt-6 max-w-xl font-mono text-sm text-paper/70 leading-relaxed">
                {t.contact.p}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href={`mailto:${links.email}`}
                  className="font-poster text-2xl sm:text-5xl text-amber hover:underline break-all"
                >
                  {links.email}
                </a>
                <button
                  onClick={copyEmail}
                  className="border border-paper/30 text-paper/80 px-3 py-2 font-mono text-[10px] font-bold tracking-widest hover:border-amber hover:text-amber transition-colors"
                >
                  {copied ? t.contact.copied : t.contact.copy}
                </button>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <a
                  href={links.github}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-paper/25 text-paper/80 px-5 py-3 font-mono text-xs font-bold hover:border-amber hover:text-amber transition-colors"
                >
                  {t.contact.links.github}
                </a>
                <a
                  href={links.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-paper/25 text-paper/80 px-5 py-3 font-mono text-xs font-bold hover:border-amber hover:text-amber transition-colors"
                >
                  {t.contact.links.linkedin}
                </a>
                {links.cv && (
                  <a
                    href={links.cv}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-amber text-amber px-5 py-3 font-mono text-xs font-bold hover:bg-amber hover:text-ink transition-colors"
                  >
                    {t.contact.links.cv}
                  </a>
                )}
              </div>
            </RevealBlock>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-paper/10 px-6 sm:px-12 py-8">
          <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] tracking-widest text-paper/40">
            <span>© {new Date().getFullYear()} VINICIUS PERES</span>
            <span>{t.ui.footer}</span>
          </div>
        </footer>
      </main>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Scene } from './three/Scene.jsx'
import { AboutOverlay } from './AboutOverlay.jsx'
import { BootLoader } from './BootLoader.jsx'
import { NavMenu } from './NavMenu.jsx'
import { StaticFallback } from './StaticFallback.jsx'
import { SectionPedal } from './SectionPedal.jsx'
import { GhostCards, GhostSectionBg } from './GhostCards.jsx'
import { VerveDemo } from './VerveDemo.jsx'
import { useLang } from '../i18n/LanguageContext.jsx'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { useReveal } from '../hooks/useReveal.js'
import { useNearViewport } from '../hooks/useNearViewport.js'
import { links } from '../content/index.js'

// única view com câmera própria além da home: o quadro do about
const VALID_VIEWS = ['home', 'about']
const GREEN = '#16a030'
const EMBER = '#ff6b2b'

function initialView() {
  const v = new URLSearchParams(window.location.search).get('view')
  return VALID_VIEWS.includes(v) ? v : 'home'
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
  const { setLang, t } = useLang()
  const reducedMotion = useReducedMotion()
  const webgl = useMemo(supportsWebGL, [])
  const [view, setView] = useState(initialView) // home | about
  const [copied, setCopied] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const handleReady = useCallback(() => setSceneReady(true), [])

  // onde a página estava antes de abrir o about (restaurado na volta)
  const returnScrollRef = useRef(null)

  // pausa o canvas do hero fora da viewport; monta/pausa o canvas do pedal da seção
  const [heroRef, heroNear] = useNearViewport('200px')
  // margem generosa: o canvas do pedal monta e compila bem antes de aparecer
  const [ghostNearRef, ghostNear] = useNearViewport('1600px')
  // roda + abre o pedal quando o palco encosta na viewport (damp lento faz
  // a abertura acontecer com o palco já em cena)
  const [ghostStageRef, ghostStageVisible] = useNearViewport('0px')

  const navigate = (v) => {
    if (v !== 'home') {
      if (returnScrollRef.current == null) returnScrollRef.current = window.scrollY
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
    }
    setView(v)
  }

  // Os objetos da cena voltam a navegar: o quadro na parede abre a view "about"
  // na própria cena; o CRT e a prateleira rolam para as seções Verve e Blog.
  const sceneNavigate = (target) => {
    if (target === 'about') return navigate('about')
    const id = target === 'verve' || target === 'blog' ? target : null
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  // rótulos curtos (bilíngues) que surgem ao passar o mouse nos hotspots da cena
  const sceneLabels = { pc: t.verve.title, painting: t.sections.about, shelf: t.blog.title }

  // Navegação do menu do topo. As views da cena (ex.: about) travam o scroll do
  // body; ao ir para uma seção rolável é preciso sair da view ANTES de rolar,
  // senão a página fica presa (não scrolla). Também libera o overflow na hora.
  const onNav = (id) => {
    const behavior = reducedMotion ? 'auto' : 'smooth'
    if (id === 'about') return navigate('about')
    returnScrollRef.current = null
    if (view !== 'home') {
      setView('home')
      document.body.style.overflow = ''
    }
    requestAnimationFrame(() => {
      if (id === 'top') window.scrollTo({ top: 0, behavior })
      else document.getElementById(id)?.scrollIntoView({ behavior })
    })
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

  // nas views da cena o body não deve rolar (evita scrollbar dupla);
  // ao voltar, devolve a página exatamente onde estava
  useEffect(() => {
    document.body.style.overflow = view === 'home' ? '' : 'hidden'
    if (view === 'home' && returnScrollRef.current != null) {
      window.scrollTo({ top: returnScrollRef.current, behavior: 'auto' })
      returnScrollRef.current = null
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [view])

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
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-end gap-4 p-6 sm:px-12 sm:py-8 bg-gradient-to-b from-[#0a0a0f]/70 to-transparent">
        <div className="pointer-events-auto flex items-center gap-5">
          <NavMenu onNav={onNav} />
        </div>
      </div>

      {/* ─────────── HERO: cena full-bleed + lockup tipográfico à esquerda ─────────── */}
      <section ref={heroRef} className="relative min-h-[100dvh] overflow-hidden">
        {/* A cena 3D é o fundo inteiro; a tela do CRT dentro dela passa o reel
            dos trabalhos (o "vídeo"). O texto vive por cima, à esquerda. */}
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <Scene
            view={view}
            reducedMotion={reducedMotion}
            active={heroNear}
            onNavigate={sceneNavigate}
            labels={sceneLabels}
            onReady={handleReady}
          />
        </div>
        {/* degradê à esquerda: garante leitura da tipografia sobre a cena */}
        {view === 'home' && (
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background:
                'linear-gradient(100deg, rgba(10,10,15,0.78) 0%, rgba(10,10,15,0.46) 30%, rgba(10,10,15,0.12) 54%, transparent 70%)',
            }}
            aria-hidden="true"
          />
        )}

        <BootLoader ready={sceneReady} />

        {/* Lockup tipográfico (a estrela) — sobreposto à cena */}
        <div
          className={`pointer-events-none absolute inset-0 z-10 flex flex-col justify-center px-6 pt-24 sm:px-12 ${
            view === 'home' ? '' : 'opacity-0'
          } transition-opacity duration-500`}
        >
          <div className="w-full sm:w-3/5">
            <p className={`font-accent italic text-4xl sm:text-6xl text-amber ${reveal(view === 'home')}`}>
              {t.hero.titleTop}
            </p>
            <h1
              className={`mt-1 font-poster uppercase leading-[0.8] tracking-tight text-paper text-[19vw] sm:text-[14vw] lg:text-[12vw] drop-shadow-[0_6px_30px_rgba(0,0,0,0.7)] ${reveal(
                view === 'home',
                'delay-150'
              )}`}
            >
              Vinícius
              <br />
              <span className="text-stroke-paper">Peres</span>
            </h1>
            <p
              className={`mt-5 font-mono text-[11px] sm:text-sm tracking-[0.3em] sm:tracking-[0.42em] text-paper/85 ${reveal(
                view === 'home',
                'delay-300'
              )}`}
            >
              {t.hero.tag}
            </p>

            {/* selo do autor: monograma + credencial + ano, num carimbo coeso */}
            <div className={`mt-8 hidden sm:inline-flex items-stretch border border-paper/25 bg-white/[0.02] backdrop-blur-sm ${reveal(view === 'home', 'delay-300')}`}>
              <div className="flex items-center justify-center border-r border-paper/25 px-4 font-poster text-4xl leading-none text-amber">
                {t.hero.badge.mono}
              </div>
              <div className="flex flex-col justify-center px-4 py-2.5">
                <span className="font-mono text-[10px] font-bold tracking-[0.28em] text-paper">
                  {t.hero.badge.l1}
                </span>
                <span className="mt-1 font-mono text-[9px] tracking-[0.22em] text-paper/55">
                  {t.hero.badge.l2}
                </span>
              </div>
              <div
                className="flex items-center border-l border-paper/25 px-2.5 font-mono text-[9px] font-bold tracking-[0.15em] text-paper/45 [writing-mode:vertical-rl]"
                aria-hidden="true"
              >
                2026
              </div>
            </div>

            {/* boas-vindas */}
            <p
              className={`mt-7 max-w-lg font-mono text-[10px] sm:text-xs font-bold leading-relaxed tracking-wider text-paper/80 ${reveal(
                view === 'home',
                'delay-500'
              )}`}
            >
              {t.hero.welcome}
            </p>

            {/* convite de idioma — no OUTRO idioma, de propósito */}
            <button
              onClick={() => setLang(t.hero.langCta.to)}
              className={`pointer-events-auto mt-8 inline-flex items-center gap-3 font-accent italic text-xl sm:text-2xl text-paper underline decoration-1 underline-offset-8 hover:text-amber transition-colors ${reveal(
                view === 'home',
                'delay-500'
              )}`}
            >
              {t.hero.langCta.label}
              <span aria-hidden="true">{t.hero.langCta.flag}</span>
            </button>
          </div>
        </div>

        {/* View do about: overlay sobre a cena (que já é fullscreen) */}
        {view === 'about' && (
          <AboutOverlay
            key="about"
            onNavigate={navigate}
            onContact={() => {
              navigate('home')
              setTimeout(
                () =>
                  document
                    .getElementById('contact')
                    ?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' }),
                350
              )
            }}
          />
        )}

        {/* rodapé do hero: socials à direita, cue de scroll no centro */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between px-6 pb-5 sm:px-12">
          <div className="w-16" aria-hidden="true" />
          <div className={`flex flex-col items-center gap-1 ${reveal(view === 'home', 'delay-500')}`}>
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
          <div
            className={`flex items-center gap-6 ${
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
        </div>
      </section>

      {/* ─────────── PÁGINA: seções roláveis ─────────── */}
      <main className="relative z-10 border-t border-paper/10">
        {/* Sobre mim mora na CENA (view do quadro); daqui pra baixo: projetos */}
        <div id="projects" className="border-b border-paper/10">
          <div className="mx-auto max-w-6xl px-6 sm:px-12 py-12 sm:py-14">
            <RevealBlock>
              <span className="font-mono text-xs font-semibold tracking-[0.3em] text-amber">
                {t.sections.projects}
              </span>
              <h2 className="mt-3 font-poster uppercase leading-[0.95] text-3xl sm:text-5xl text-paper">
                {t.projects.title}
              </h2>
              <p className="mt-3 max-w-xl font-mono text-xs sm:text-sm text-paper/60 leading-relaxed">
                {t.projects.sub}
              </p>
            </RevealBlock>
          </div>
        </div>

        {/* GHOST FX — tela única: o pedal abre sozinho ao entrar em cena; cards na mesma tela */}
        <section id="ghost" ref={ghostNearRef} className="relative overflow-hidden">
          <GhostSectionBg />
          <div className="relative mx-auto flex min-h-[100dvh] max-w-6xl flex-col justify-center gap-8 px-6 sm:px-12 py-14 sm:py-16">
            {/* grid-cols-1 é obrigatório: sem template, o track auto dimensiona
                pelo conteúdo (max-w-md = 448px) e estoura o viewport no mobile */}
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
              <RevealBlock>
                <span className="font-mono text-xs font-semibold tracking-[0.25em]" style={{ color: GREEN }}>
                  {t.ghost.tag}
                </span>
                {/* wordmark como a marca escreve (LoadingScreen do app): Saira 800, FX em verde */}
                <h2
                  className="mt-3 text-5xl sm:text-7xl leading-none"
                  style={{
                    fontFamily: "'Saira', sans-serif",
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    color: '#e7e4dc',
                  }}
                >
                  GHOST<span style={{ color: '#20f040' }}>FX</span>
                </h2>
                <p className="mt-4 font-mono text-sm font-bold tracking-widest text-paper">
                  {t.ghost.subtitle}
                </p>
                <p className="mt-4 max-w-md font-mono text-xs sm:text-sm text-paper/70 leading-relaxed">
                  {t.ghost.intro}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={links.ghostApp}
                    target="_blank"
                    rel="noreferrer"
                    className="border-2 px-5 py-3 font-mono text-xs font-bold transition-colors"
                    style={{ borderColor: GREEN, background: GREEN, color: '#0a0a0f' }}
                  >
                    {t.ghost.ready.play}
                  </a>
                  <a
                    href={links.ghostSource}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-paper/25 text-paper/80 px-5 py-3 font-mono text-xs font-bold hover:border-paper hover:text-paper transition-colors"
                  >
                    {t.ghost.ready.source}
                  </a>
                </div>
              </RevealBlock>

              {/* palco do pedal: monta cedo (Preload compila parado) e só RODA
                  quando visível — canvas ativo fora da tela = lag no resto */}
              <div ref={ghostStageRef} className="relative h-[40vh] min-h-[320px] md:h-[52vh]">
                {ghostNear && <SectionPedal open={ghostStageVisible} active={ghostStageVisible} />}
              </div>
            </div>

            {/* knobs interativos + colorways dos presets, na mesma tela */}
            <GhostCards />
          </div>
        </section>

        {/* VERVE — terminal vivo */}
        <section id="verve" className="relative border-t border-paper/10 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(55% 55% at 30% 50%, rgba(255,107,43,0.07), transparent 70%)' }}
          />
          <div className="relative mx-auto grid grid-cols-1 max-w-6xl items-center gap-10 px-6 sm:px-12 py-24 sm:py-32 md:grid-cols-2">
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

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Scene } from './three/Scene.jsx'
import { AboutOverlay } from './AboutOverlay.jsx'
import { BootLoader } from './BootLoader.jsx'
import { StaticFallback } from './StaticFallback.jsx'
import { GitHubIcon, LinkedInIcon, InstagramIcon } from './SocialIcons.jsx'
import { useLang } from '../i18n/LanguageContext.jsx'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { useReveal } from '../hooks/useReveal.js'
import { useNearViewport } from '../hooks/useNearViewport.js'
import { links } from '../content/index.js'

// Tudo abaixo da dobra sai do chunk inicial: o hero interage antes de o
// código do pedal/terminal (drei extra + troika) terminar de baixar
const SectionPedal = lazy(() => import('./SectionPedal.jsx').then((m) => ({ default: m.SectionPedal })))
const GhostCards = lazy(() => import('./GhostCards.jsx').then((m) => ({ default: m.GhostCards })))
const GhostSectionBg = lazy(() => import('./GhostCards.jsx').then((m) => ({ default: m.GhostSectionBg })))
const VerveDemo = lazy(() => import('./VerveDemo.jsx').then((m) => ({ default: m.VerveDemo })))

// redes do contato/footer, na ordem de exibição (rótulos vêm do dicionário)
const SOCIALS = [
  { key: 'github', Icon: GitHubIcon },
  { key: 'linkedin', Icon: LinkedInIcon },
  { key: 'instagram', Icon: InstagramIcon },
]

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
  // true quando NÓS empurramos a entrada ?view=about no history (vs deep-load)
  const pushedViewRef = useRef(false)
  // 0..1 conforme a página rola pra longe do hero: apaga o fogo/luzes da cena
  const dimRef = useRef(0)

  // pausa o canvas do hero fora da viewport; monta/pausa o canvas do pedal da seção
  const [heroRef, heroNear] = useNearViewport('200px')
  // margem generosa: o canvas do pedal monta e compila bem antes de aparecer.
  // Depois de montar uma vez, FICA montado (frameloop pausa fora da tela):
  // desmontar/remontar refazia contexto WebGL + HDRI a cada revisita
  const [ghostNearRef, ghostNear] = useNearViewport('1600px')
  const [ghostSeen, setGhostSeen] = useState(false)
  useEffect(() => {
    if (ghostNear) setGhostSeen(true)
  }, [ghostNear])
  // roda + abre o pedal quando o palco encosta na viewport (damp lento faz
  // a abertura acontecer com o palco já em cena)
  const [ghostStageRef, ghostStageVisible] = useNearViewport('0px')

  // Entrar numa view trava o scroll do body no mesmo commit: um scroll SUAVE
  // em voo seria congelado no meio e o overlay (absoluto no hero) ficaria
  // cortado fora da tela — por isso o pulo pro topo é instantâneo.
  const navigate = (v) => {
    if (v !== 'home') {
      if (returnScrollRef.current == null) returnScrollRef.current = window.scrollY
      window.scrollTo({ top: 0, behavior: 'auto' })
      if (!pushedViewRef.current && initialView() === 'home') {
        pushedViewRef.current = true
        window.history.pushState({ view: v }, '', `?view=${v}`)
      }
    }
    setView(v)
  }

  // Sair da view pela UI (VOLTAR/Escape/contato): desfaz a entrada do history
  // que criamos (Back do navegador fecha o about em vez de sair do site);
  // num deep-load (?view=about) só limpa a URL.
  const leaveView = () => {
    if (pushedViewRef.current) {
      pushedViewRef.current = false
      window.history.back()
    } else {
      window.history.replaceState(null, '', window.location.pathname)
      setView('home')
    }
  }

  // Único objeto interativo da cena: o quadro abre a view "about"
  // (CRT e pedal são decoração, sem hover/clique).
  const sceneNavigate = (target) => {
    if (target === 'about') navigate('about')
  }

  // rótulo curto (bilíngue) que surge ao passar o mouse no quadro
  const sceneLabels = { painting: t.sections.about }

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

  // Back/Forward do navegador abre/fecha a view about
  useEffect(() => {
    const onPop = (e) => {
      pushedViewRef.current = false
      setView(e.state?.view === 'about' ? 'about' : 'home')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // dim 0..1 conforme o hero sai de cena (a cena apaga o fogo com isso);
  // só muta ref: zero re-render por scroll
  useEffect(() => {
    const onScroll = () => {
      dimRef.current = Math.min(1, window.scrollY / window.innerHeight)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // deep-link para seções (#ghost, #contact…): rola após o layout assentar.
  // #about mapeia pra view da cena; e se a página já ABRIU numa view
  // (?view=about), o body está travado — rolar seria um estado quebrado.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return
    if (id === 'about') return navigate('about')
    if (initialView() !== 'home') return
    const tm = setTimeout(() => document.getElementById(id)?.scrollIntoView(), 500)
    return () => clearTimeout(tm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Escape volta ao quarto de qualquer view
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') leaveView()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!webgl) return <StaticFallback />

  // delayCls deve ser classe literal (ex.: 'delay-150'), Tailwind não vê interpolação
  const reveal = (active, delayCls = '') =>
    `transition-all duration-700 ease-out ${
      active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    } ${delayCls}`

  return (
    <div className="relative w-full bg-[#0a0a0f] text-paper">
      {/* resumo para leitores de tela — a cena 3D é decorativa */}
      <p className="sr-only">{t.ui.srIntro}</p>

      {/* ─────────── HERO: cena full-bleed + lockup tipográfico à esquerda ─────────── */}
      <section ref={heroRef} className="snap-section relative min-h-[100dvh] overflow-hidden">
        {/* A cena 3D é o fundo inteiro; a tela do CRT dentro dela passa o reel
            dos trabalhos (o "vídeo"). O texto vive por cima, à esquerda. */}
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <Scene
            view={view}
            reducedMotion={reducedMotion}
            active={heroNear}
            onNavigate={sceneNavigate}
            labels={sceneLabels}
            markers={{ about: true }}
            dimRef={dimRef}
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

        {/* Lockup tipográfico (a estrela) — sobreposto à cena. Fora da home ele
            precisa de `invisible` (não só opacity-0): senão os botões seguem
            clicáveis/focáveis por baixo do overlay do about */}
        <div
          className={`pointer-events-none absolute inset-0 z-10 flex flex-col justify-start px-6 pt-[22dvh] sm:justify-center sm:pt-0 sm:px-12 ${
            view === 'home' ? '' : 'opacity-0 invisible'
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
              <span className="text-stroke-paper">Vinicius</span>
              <br />
              Peres
            </h1>
            <p
              className={`mt-5 font-mono text-[11px] sm:text-sm tracking-[0.3em] sm:tracking-[0.42em] text-paper/85 ${reveal(
                view === 'home',
                'delay-300'
              )}`}
            >
              {t.hero.tag}
            </p>

            {/* faixa de selos sob o lockup (como a Jeleiz): só as três marcas,
                soltas e nítidas — texto aqui dissoava do conjunto */}
            <div className={`mt-8 hidden sm:flex items-center gap-5 ${reveal(view === 'home', 'delay-300')}`}>
              <img src="/peres-logo.svg" alt="" className="h-16 w-16" />
              <span className="text-paper/35" aria-hidden="true">
                ·
              </span>
              <img src="/peres-stamp-wordmark.svg" alt="" className="h-[68px] w-auto invert opacity-90" />
              <span className="text-paper/35" aria-hidden="true">
                ·
              </span>
              <img src="/peres-stamp-globe.svg" alt="" className="h-[68px] w-auto invert opacity-90" />
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

            {/* entrada pro "sobre mim" (view do quadro na cena) + convite de
                idioma, escrito no OUTRO idioma de propósito */}
            <div className={`mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 ${reveal(view === 'home', 'delay-500')}`}>
              <button
                onClick={() => navigate('about')}
                className="pointer-events-auto border-2 border-amber px-5 py-3 font-mono text-xs font-bold text-amber hover:bg-amber hover:text-ink transition-colors"
              >
                {t.sections.about}
              </button>
              <button
                onClick={() => setLang(t.hero.langCta.to)}
                className="pointer-events-auto inline-flex items-center gap-3 font-accent italic text-xl sm:text-2xl text-paper underline decoration-1 underline-offset-8 hover:text-amber transition-colors"
              >
                {t.hero.langCta.label}
                <span aria-hidden="true">{t.hero.langCta.flag}</span>
              </button>
            </div>
          </div>
        </div>

        {/* View do about: overlay sobre a cena (que já é fullscreen) */}
        {view === 'about' && (
          <AboutOverlay
            key="about"
            onNavigate={(v) => (v === 'home' ? leaveView() : navigate(v))}
            onContact={() => {
              leaveView()
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

        {/* rodapé do hero: cue de scroll centralizada — clicável, leva à
            primeira seção (quem pede pra rolar tem que rolar no clique) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between px-6 pb-5 sm:px-12">
          <div className="w-16" aria-hidden="true" />
          <button
            onClick={() =>
              document
                .getElementById('projects')
                ?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
            }
            className={`pointer-events-auto flex flex-col items-center gap-1 p-3 text-paper/55 hover:text-amber transition-colors ${reveal(
              view === 'home',
              'delay-500'
            )} ${view === 'home' ? '' : 'invisible'}`}
          >
            <span className="font-mono text-[9px] tracking-[0.3em]">{t.ui.scrollHint}</span>
            <span className={`text-xs ${reducedMotion ? '' : 'animate-bounce'}`} aria-hidden="true">
              ↓
            </span>
          </button>
          <div className="w-16" aria-hidden="true" />
        </div>
      </section>

      {/* ─────────── PÁGINA: seções roláveis ─────────── */}
      <main className="relative z-10 border-t border-paper/10">
        {/* Sobre mim mora na CENA (view do quadro); daqui pra baixo: projetos */}
        <div id="projects" className="snap-section border-b border-paper/10">
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
        <section id="ghost" ref={ghostNearRef} className="snap-section relative overflow-hidden">
          <Suspense fallback={null}>
            <GhostSectionBg />
          </Suspense>
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
                {(ghostNear || ghostSeen) && (
                  <Suspense fallback={null}>
                    <SectionPedal open={ghostStageVisible} active={ghostStageVisible} />
                  </Suspense>
                )}
              </div>
            </div>

            {/* knobs interativos + colorways dos presets, na mesma tela */}
            <Suspense fallback={null}>
              <GhostCards />
            </Suspense>
          </div>
        </section>

        {/* VERVE — terminal vivo */}
        <section id="verve" className="snap-section relative border-t border-paper/10 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(55% 55% at 30% 50%, rgba(255,107,43,0.07), transparent 70%)' }}
          />
          <div className="relative mx-auto grid grid-cols-1 max-w-6xl items-center gap-10 px-6 sm:px-12 py-24 sm:py-32 md:grid-cols-2">
            <RevealBlock className="order-2 md:order-1">
              <Suspense fallback={null}>
                <VerveDemo />
              </Suspense>
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
        <section id="blog" className="snap-section border-t border-paper/10">
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
        <section id="contact" className="snap-section border-t border-paper/10">
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
              {/* redes: ícone + rótulo, com o âmbar preenchendo de baixo
                  pra cima no hover (o ícone acompanha via currentColor) */}
              <div className="mt-10 flex flex-wrap gap-3">
                {SOCIALS.filter((s) => links[s.key]).map((s) => (
                  <a
                    key={s.key}
                    href={links[s.key]}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative isolate overflow-hidden border border-paper/25 px-5 py-3 text-paper/80 hover:border-amber hover:text-ink focus-visible:border-amber transition-colors"
                  >
                    <span
                      className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-amber transition-transform duration-300 ease-out group-hover:scale-y-100 group-focus-visible:scale-y-100"
                      aria-hidden="true"
                    />
                    <span className="flex items-center gap-2.5">
                      <s.Icon width={16} height={16} />
                      <span className="font-mono text-xs font-bold">{t.contact.links[s.key]}</span>
                    </span>
                  </a>
                ))}
                {links.cv && (
                  <a
                    href={links.cv}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-amber bg-amber/10 text-amber px-5 py-3 font-mono text-xs font-bold hover:bg-amber hover:text-ink transition-colors"
                  >
                    {t.contact.links.cv}
                  </a>
                )}
              </div>
            </RevealBlock>
          </div>
        </section>

        {/* Footer: pillmark como marca d'água texturizando o fundo + navegação */}
        <footer className="relative border-t border-paper/10 overflow-hidden">
          {/* marca d'água: no mobile as letras viravam blocos gigantes atrás
              dos links (ilegível) — só entra quando há largura pra ela ler
              como textura */}
          <img
            src="/peres-pillmark.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none absolute left-1/2 top-1/2 hidden w-[115%] max-w-none -translate-x-1/2 -translate-y-1/2 invert opacity-[0.045] sm:block"
          />
          <div className="relative mx-auto max-w-6xl px-6 sm:px-12 pt-14 sm:pt-16 pb-8">
            <div className="flex flex-wrap items-start justify-between gap-10">
              <div>
                <img src="/peres-stamp-wordmark.svg" alt="Vinicius Peres" className="h-12 w-auto invert opacity-90" />
                <p className="mt-4 font-mono text-[10px] tracking-[0.22em] text-paper/45">
                  {t.hero.badge.l2}
                </p>
              </div>
              <div className="flex gap-14 sm:gap-24">
                <nav className="flex flex-col gap-3" aria-label={t.sections.projects}>
                  <span className="font-mono text-[10px] font-semibold tracking-[0.3em] text-amber">
                    {t.sections.projects}
                  </span>
                  <a href="#ghost" className="font-mono text-xs text-paper/60 hover:text-amber transition-colors">
                    GHOSTFX
                  </a>
                  <a href="#verve" className="font-mono text-xs text-paper/60 hover:text-amber transition-colors">
                    VERVE
                  </a>
                  <a href="#blog" className="font-mono text-xs text-paper/60 hover:text-amber transition-colors">
                    {t.sections.blog}
                  </a>
                </nav>
                <nav className="flex flex-col gap-3" aria-label={t.ui.socials}>
                  <span className="font-mono text-[10px] font-semibold tracking-[0.3em] text-amber">
                    {t.ui.socials}
                  </span>
                  {SOCIALS.filter((s) => links[s.key]).map((s) => (
                    <a
                      key={s.key}
                      href={links[s.key]}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 font-mono text-xs text-paper/60 hover:text-amber transition-colors"
                    >
                      <s.Icon width={13} height={13} />
                      {t.contact.links[s.key]}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-paper/10 pt-6 font-mono text-[10px] tracking-widest text-paper/55">
              <span>© {new Date().getFullYear()} VINICIUS PERES</span>
              <img src="/peres-stamp-globe.svg" alt="" className="h-7 w-auto invert opacity-50" />
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

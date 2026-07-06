import { Scene } from './three/Scene.jsx'
import { InView } from './three/InView.jsx'

const STACK = [
  'REACT',
  'TYPESCRIPT',
  'RUST',
  'WEB AUDIO',
  'THREE.JS',
  'NODE',
  'TAILWIND',
  'WEBGL',
  'VITE',
  'POSTGRES',
]

const SOCIALS = [
  {
    href: 'https://github.com/vinicsperes',
    label: 'GitHub',
    path: 'M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49l-.01-1.9c-2.78.62-3.37-1.2-3.37-1.2-.46-1.18-1.11-1.5-1.11-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9l-.01 2.82c0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z',
  },
  {
    href: 'https://linkedin.com/in/vinicsperes',
    label: 'LinkedIn',
    path: 'M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.24 8h4.5v14H.24V8Zm7.5 0h4.31v1.92h.06c.6-1.14 2.07-2.34 4.26-2.34 4.56 0 5.4 3 5.4 6.9V22h-4.5v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.49V22h-4.5V8Z',
  },
  {
    href: 'mailto:vinicsperes@gmail.com',
    label: 'Email',
    path: 'M2 4h20c.55 0 1 .45 1 1v14c0 .55-.45 1-1 1H2c-.55 0-1-.45-1-1V5c0-.55.45-1 1-1Zm10 7.2 8-5.2H4l8 5.2Zm0 2.3L3 7.7V18h18V7.7l-9 5.8Z',
  },
]

function TopBar() {
  return (
    <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-6 lg:px-12">
      <a href="#" className="flex items-center gap-4">
        <span className="flex h-9 w-9 items-center justify-center border-2 border-ink font-poster text-lg">
          V
        </span>
        <span className="flex items-center gap-2 font-mono text-xs font-semibold tracking-[0.25em]">
          <span className="text-amber">●</span> VINICIUS PERES
        </span>
      </a>
      <div className="flex items-center gap-3 font-mono text-xs font-semibold tracking-[0.25em]">
        <span className="hidden sm:inline">MENU</span>
        <span className="grid grid-cols-3 gap-[3px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="h-[3px] w-[3px] bg-ink" />
          ))}
        </span>
      </div>
    </div>
  )
}

function Marquee() {
  const row = [...STACK, ...STACK]
  return (
    <div className="overflow-hidden border-y-2 border-ink bg-ink py-2.5">
      <div className="marquee-track flex w-max whitespace-nowrap">
        {row.map((s, i) => (
          <span
            key={i}
            className="flex items-center font-mono text-xs font-semibold tracking-[0.25em] text-paper"
          >
            <span className="px-6">{s}</span>
            <span className="text-amber">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Badge() {
  return (
    <div className="flex w-full max-w-md items-stretch border-2 border-ink font-mono">
      <span className="flex items-center justify-center border-r-2 border-ink px-5 font-poster text-3xl">
        V
      </span>
      <span className="flex flex-1 flex-col justify-center px-5 py-2 text-xs leading-tight font-semibold tracking-[0.18em]">
        <span>VINICIUSPERES</span>
        <span className="text-ink/55">DESIGNS</span>
      </span>
      <span className="flex items-center border-l-2 border-ink px-4 font-poster text-xl leading-none tracking-tight text-amber">
        <span className="flex flex-col">
          <span>20</span>
          <span>26</span>
        </span>
      </span>
    </div>
  )
}

function PcCard() {
  return (
    <div className="relative border-2 border-ink bg-ink text-paper shadow-[10px_10px_0_0_var(--color-amber)]">
      {/* header */}
      <div className="flex items-start justify-between border-b-2 border-ink/50 px-4 py-3 font-mono text-[10px] tracking-[0.2em]">
        <div className="space-y-1 text-paper/70">
          <div>[ SYSTEM / VP-01 ]</div>
          <div className="text-paper/40">RETRO-PC REV 2.6</div>
        </div>
        <span className="flex items-center gap-2 text-amber">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber" />
          STATUS: ON_FIRE
        </span>
      </div>

      {/* palco 3D */}
      <div className="relative">
        <InView
          className="scanlines relative h-[52vh] w-full lg:h-[60vh]"
          style={{
            background:
              'radial-gradient(115% 80% at 50% 12%, rgba(255,120,40,0.16), rgba(10,10,14,0) 52%), radial-gradient(120% 120% at 50% 108%, rgba(24,24,32,0.9), #07070b 70%)',
          }}
        >
          <Scene />
        </InView>

        {/* cantos de mira */}
        <span className="pointer-events-none absolute top-3 left-3 h-3 w-3 border-t border-l border-paper/40" />
        <span className="pointer-events-none absolute top-3 right-3 h-3 w-3 border-t border-r border-paper/40" />
        <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-paper/40" />
        <span className="pointer-events-none absolute right-3 bottom-3 h-3 w-3 border-r border-b border-paper/40" />

        {/* crosshair */}
        <span className="pointer-events-none absolute top-1/2 left-6 font-mono text-lg text-paper/30">
          +
        </span>

        {/* régua de medição à direita */}
        <div className="pointer-events-none absolute top-1/2 right-4 flex -translate-y-1/2 flex-col items-end gap-8 font-mono text-[9px] text-paper/40">
          {['01', '02', '03'].map((n) => (
            <span key={n} className="flex items-center gap-1.5">
              {n}
              <span className="h-px w-3 bg-paper/30" />
            </span>
          ))}
        </div>
      </div>

      {/* rodapé */}
      <div className="flex items-center justify-between border-t-2 border-ink/50 px-4 py-2.5 font-mono text-[10px] tracking-[0.2em] text-paper/50">
        <span className="font-poster text-base tracking-tight text-paper/60">V</span>
        <span className="flex items-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`inline-block h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-amber' : 'bg-paper/25'}`}
            />
          ))}
        </span>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden">
      <TopBar />

      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-stretch gap-10 px-6 py-10 lg:grid-cols-[1fr_1fr] lg:gap-14 lg:px-12">
        {/* coluna esquerda */}
        <div className="relative z-10 flex flex-col justify-center">
          <p className="font-mono text-sm font-semibold tracking-[0.3em] text-amber">
            SOFTWARE ENGINEER <span className="text-ink/40">·</span> 2026
          </p>

          <h1 className="mt-4 font-poster text-[clamp(3.5rem,10vw,8.5rem)] leading-[0.82] tracking-tight uppercase">
            Hi! I&apos;m
            <br />
            Vinícius
          </h1>

          <div className="mt-8">
            <Badge />
          </div>

          <p className="mt-7 max-w-md border-l-2 border-amber pl-4 font-mono text-xs leading-relaxed tracking-wide text-ink/70 uppercase">
            Hi! Welcome to my website. Here you&apos;ll find my work building
            instruments, tools and interfaces — for the browser and the terminal.
            Hope you have fun!
          </p>

          <div className="mt-8 flex flex-wrap gap-3 font-mono text-sm font-semibold">
            <a
              href="#projetos"
              className="border-2 border-ink bg-ink px-7 py-3 tracking-wide text-paper shadow-[3px_3px_0_0_var(--color-amber)] transition-transform hover:-translate-y-0.5"
            >
              → PROJETOS
            </a>
            <a
              href="#contato"
              className="border-2 border-ink bg-transparent px-7 py-3 tracking-wide text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              → CONTATO
            </a>
          </div>

          {/* scroll-down + sociais */}
          <div className="mt-14 flex items-end justify-between">
            <a href="#projetos" className="group flex flex-col gap-2 font-mono text-[10px] font-semibold tracking-[0.25em] text-ink/60">
              SCROLL
              <br />
              DOWN
              <span className="mt-1 text-base transition-transform group-hover:translate-y-1">↓</span>
            </a>
            <div className="flex gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.href.startsWith('http') ? '_blank' : undefined}
                  rel={s.href.startsWith('http') ? 'noreferrer' : undefined}
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center border-2 border-ink transition-colors hover:bg-ink hover:text-paper"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* coluna direita */}
        <div className="relative">
          <PcCard />
        </div>
      </div>

      <Marquee />
    </section>
  )
}

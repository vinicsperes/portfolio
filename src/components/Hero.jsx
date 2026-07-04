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
    <div className="mt-8 flex flex-wrap items-stretch gap-0 font-mono">
      <span className="flex items-center justify-center border-2 border-ink px-4 font-poster text-2xl">
        V
      </span>
      <span className="flex flex-col justify-center border-2 border-l-0 border-ink px-4 py-2 text-[10px] leading-tight font-semibold tracking-[0.15em]">
        <span>VINICSPERES DESIGNS</span>
        <span className="text-ink/60">CODE &amp; INTERFACES SINCE ALWAYS</span>
      </span>
      <span className="flex items-center justify-center border-2 border-l-0 border-ink px-4 text-sm font-semibold tracking-widest">
        2026
      </span>
    </div>
  )
}

function BurningPcCard() {
  return (
    <div className="relative border-2 border-ink bg-ink shadow-[8px_8px_0_0_var(--color-amber)]">
      <div className="flex items-center justify-between border-b-2 border-ink/60 px-4 py-2 font-mono text-[10px] tracking-[0.2em] text-paper/70">
        <span>[ SYSTEM / VP-01 ]</span>
        <span className="flex items-center gap-2 text-amber">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber" />
          STATUS: ON_FIRE
        </span>
      </div>

      <InView className="scanlines relative h-[42vh] w-full lg:h-[58vh]">
        <Scene />
        <span className="pointer-events-none absolute top-2 left-2 h-3 w-3 border-t border-l border-paper/40" />
        <span className="pointer-events-none absolute top-2 right-2 h-3 w-3 border-t border-r border-paper/40" />
        <span className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-paper/40" />
        <span className="pointer-events-none absolute right-2 bottom-2 h-3 w-3 border-r border-b border-paper/40" />
      </InView>

      <div className="flex items-center justify-between border-t-2 border-ink/60 px-4 py-2 font-mono text-[10px] tracking-[0.2em] text-paper/50">
        <span>RETRO-PC · REV 2.6</span>
        <span>ARRASTA PRA GIRAR</span>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
        {/* texto */}
        <div className="relative z-10">
          <h1 className="font-poster text-[clamp(3.5rem,11vw,9rem)] leading-[0.82] tracking-tight uppercase">
            Hi! I&apos;m
            <br />
            <span className="relative w-fit">
              Vinícius
              <span className="absolute -bottom-1 left-0 h-3 w-full -skew-x-6 bg-amber/40" />
            </span>
          </h1>

          <p className="mt-6 font-mono text-sm font-semibold tracking-[0.3em] text-ink/70">
            SOFTWARE ENGINEER · 2026
          </p>

          <Badge />

          <p className="mt-8 max-w-md font-mono text-xs leading-relaxed tracking-wide text-ink/70 uppercase">
            Hii, welcome to my website. Here you&apos;ll find my work building
            instruments, tools and interfaces — for the browser and the terminal.
            Hope you have fun!
          </p>

          <div className="mt-9 flex flex-wrap gap-3 font-mono text-sm font-semibold">
            <a
              href="#projetos"
              className="border-2 border-ink bg-ink px-6 py-3 tracking-wide text-paper shadow-[3px_3px_0_0_var(--color-amber)] transition-transform hover:-translate-y-0.5"
            >
              → PROJETOS
            </a>
            <a
              href="#contato"
              className="border-2 border-ink bg-transparent px-6 py-3 tracking-wide text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              → CONTATO
            </a>
          </div>
        </div>

        {/* PC em chamas */}
        <div className="relative">
          <BurningPcCard />
        </div>
      </div>

      <Marquee />
    </section>
  )
}

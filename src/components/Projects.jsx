import { useEffect, useState } from 'react'
import Pedal3D from './three/pedal/Pedal3D.tsx'
import { InView } from './three/InView.jsx'

/* ---------- GHOST: pedal 3D real (sem girar, vista 3/4 de lado) ---------- */

const GHOST_PALETTE = {
  bg: '#030308',
  pedal: '#1a1a1c',
  ink: '#e0e0ec',
  accent: '#20f040',
  cream: '#a8a8bc',
  metal: '#505060',
}

function GhostPedal() {
  const [playing, setPlaying] = useState(true)
  const [stompCount, setStompCount] = useState(0)
  const [knobs, setKnobs] = useState({
    drive: 0.35,
    echo: 0.58,
    tone: 0.62,
    reverb: 0.78,
    mod: 0.3,
    master: 0.85,
  })

  return (
    <Pedal3D
      ledColor={GHOST_PALETTE.accent}
      isPlaying={playing}
      onTap={() => setPlaying((p) => !p)}
      onStomp={() => setStompCount((c) => c + 1)}
      knobDrive={knobs.drive}
      knobEcho={knobs.echo}
      knobTone={knobs.tone}
      knobReverb={knobs.reverb}
      knobMod={knobs.mod}
      knobMaster={knobs.master}
      onKnobChange={(knob, value) => setKnobs((s) => ({ ...s, [knob]: value }))}
      palette={GHOST_PALETTE}
      stompCount={stompCount}
      view={[-4.4, 3.0, 5.2]}
    />
  )
}

/* ---------- VERVE: terminal do teste de digitação ---------- */

const TYPING_TEXT = 'speed comes from calm and steady hands'

function TypingTerminal() {
  const [typed, setTyped] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setTyped((t) => (t >= TYPING_TEXT.length ? 0 : t + 1))
    }, 90)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="scanlines flex h-full flex-col justify-center bg-ink p-8 font-mono text-paper lg:p-10">
      <p className="mb-5 text-xs tracking-[0.2em] text-paper/40">~/verve · type-test</p>
      <p className="text-[15px] leading-relaxed break-words lg:text-lg">
        {TYPING_TEXT.split('').map((ch, i) => {
          const done = i < typed
          const isCaret = i === typed
          return (
            <span
              key={i}
              className={isCaret ? 'bg-amber text-ink' : done ? 'text-phosphor' : 'text-paper/30'}
            >
              {ch}
            </span>
          )
        })}
      </p>
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[11px] tracking-[0.2em] text-paper/60">
        <span className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber" />
          195 WPM
        </span>
        <span>98% ACC</span>
        <span>STREAK 12</span>
        <span>3s</span>
      </div>
    </div>
  )
}

/* ---------- blocos compartilhados ---------- */

function Tag({ children, tone }) {
  return (
    <span className={`font-mono text-[11px] font-semibold tracking-[0.2em] ${tone}`}>{children}</span>
  )
}

function Features({ items, tone }) {
  return (
    <ul className="mt-6 space-y-2.5 font-mono text-[11px] tracking-wide sm:text-xs">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className={tone}>→</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

function Links({ links, tone }) {
  return (
    <div className="mt-8 flex flex-wrap gap-5 font-mono text-xs font-semibold tracking-wide">
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          className={`underline decoration-2 underline-offset-4 transition-colors ${tone}`}
        >
          {l.label} →
        </a>
      ))}
    </div>
  )
}

/* ---------- seção ---------- */

export function Projects() {
  return (
    <section id="projetos" className="px-6 py-16 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex items-end justify-between border-b-2 border-ink pb-4">
          <div>
            <span className="font-mono text-xs font-semibold tracking-[0.2em] text-ink/50">
              <span className="text-amber">//</span> TRABALHO SELECIONADO
            </span>
            <h2 className="mt-2 font-poster text-[clamp(2.5rem,6vw,4.5rem)] leading-none tracking-tight uppercase">
              Projetos
            </h2>
          </div>
          <span className="font-mono text-sm text-ink/50">02</span>
        </div>

        <div className="space-y-10">
          {/* GHOST — card escuro, pedal à esquerda */}
          <article
            id="ghost"
            className="grid overflow-hidden border-2 border-ink bg-ink text-paper shadow-[10px_10px_0_0_var(--color-ink)] lg:grid-cols-[1.05fr_0.95fr]"
          >
            <InView
              className="scanlines relative min-h-[360px] border-b-2 border-ink/40 lg:min-h-[480px] lg:border-r-2 lg:border-b-0"
              style={{ background: GHOST_PALETTE.bg }}
            >
              <GhostPedal />
              <span className="pointer-events-none absolute bottom-3 left-4 font-mono text-[10px] tracking-[0.2em] text-phosphor/50">
                pedal 3D · knobs + footswitch
              </span>
            </InView>

            <div className="flex flex-col justify-center p-8 lg:p-12">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-poster text-5xl tracking-tight uppercase lg:text-6xl">Ghost</h3>
                <Tag tone="text-phosphor">WEB AUDIO · 3D</Tag>
              </div>
              <p className="mt-5 max-w-md font-mono text-xs leading-relaxed text-paper/70 sm:text-[13px]">
                One pedal, haunted tones. Pedal de voz que roda no navegador — drive,
                echo, modulation &amp; reverb, zero install. Com anti-microfonia que
                segura o berro antes de você passar vergonha.
              </p>
              <Features
                tone="text-phosphor"
                items={[
                  'DSP EM WEB AUDIO, LATÊNCIA MÍNIMA',
                  'ANTI-FEEDBACK: NOTCH ADAPTATIVO + MUTE',
                  'PRESETS: GHOST · DOOM · FROST · HEAVY · HAZE · FEVER',
                ]}
              />
              <Links
                tone="text-phosphor decoration-phosphor/40 hover:text-paper"
                links={[
                  { href: 'https://ghostfx.app', label: 'GHOSTFX.APP' },
                  { href: 'https://github.com/vinicsperes/ghostfx', label: 'GITHUB' },
                ]}
              />
            </div>
          </article>

          {/* VERVE — card claro, terminal à direita */}
          <article
            id="verve"
            className="grid overflow-hidden border-2 border-ink bg-paper-dim shadow-[10px_10px_0_0_var(--color-ink)] lg:grid-cols-[0.95fr_1.05fr]"
          >
            <div className="flex flex-col justify-center p-8 lg:p-12">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-poster text-5xl tracking-tight uppercase lg:text-6xl">Verve</h3>
                <Tag tone="text-amber">RUST · TERMINAL</Tag>
              </div>
              <p className="mt-5 max-w-md font-mono text-xs leading-relaxed text-ink/70 sm:text-[13px]">
                Teste de digitação minimalista no terminal. Cada caractere acende
                conforme você digita — feito em Rust, binário único, sem install.
              </p>
              <Features
                tone="text-amber"
                items={[
                  'WPM, ACCURACY E STREAK EM TEMPO REAL',
                  'BINÁRIO ÚNICO, ZERO DEPENDÊNCIAS',
                  'LINUX X86_64 (POR ENQUANTO)',
                ]}
              />
              <Links
                tone="text-ink decoration-amber hover:text-amber"
                links={[{ href: 'https://github.com/vinicsperes/verve', label: 'GITHUB' }]}
              />
            </div>

            <div className="min-h-[320px] border-t-2 border-ink lg:min-h-[440px] lg:border-t-0 lg:border-l-2">
              <TypingTerminal />
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

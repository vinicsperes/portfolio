const LINKS = [
  { href: 'https://github.com/vinicsperes', label: 'github.com/vinicsperes' },
  { href: 'https://linkedin.com/in/vinicsperes', label: 'linkedin/vinicsperes' },
  { href: 'mailto:vinicsperes@gmail.com', label: 'vinicsperes@gmail.com' },
]

export function Contact() {
  return (
    <section id="contato" className="border-t-2 border-ink px-6 py-24 lg:py-32">
      <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
        <span className="font-mono text-xs font-semibold tracking-[0.2em] text-ink/50">
          <span className="text-amber">//</span> BORA CONVERSAR
        </span>

        <h2
          className="mt-6 font-poster text-[clamp(3rem,13vw,11rem)] leading-[0.85] tracking-tight text-ink uppercase"
          style={{ textShadow: '6px 7px 0 var(--color-amber)' }}
        >
          Let&apos;s get
          <br />
          in touch
        </h2>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 font-mono text-sm font-semibold tracking-wide">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target={l.href.startsWith('http') ? '_blank' : undefined}
              rel={l.href.startsWith('http') ? 'noreferrer' : undefined}
              className="underline decoration-amber decoration-2 underline-offset-4 transition-colors hover:text-amber"
            >
              {l.label}
            </a>
          ))}
        </div>

        <p className="mt-16 font-mono text-[11px] tracking-[0.2em] text-ink/40">
          © 2026 VINÍCIUS PERES · FEITO COM REACT, THREE.JS &amp; CAFEÍNA
        </p>
      </div>
    </section>
  )
}

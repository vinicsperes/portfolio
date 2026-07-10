import { useLang } from '../i18n/LanguageContext.jsx'
import { links } from '../content/index.js'

/** Página estática mínima para navegadores sem WebGL. */
export function StaticFallback() {
  const { t } = useLang()

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-paper p-8 sm:p-16 font-mono">
      <header className="mb-12">
        <p className="text-xs tracking-[0.2em] text-amber">{t.hero.tag}</p>
        <h1 className="font-poster text-5xl sm:text-7xl uppercase leading-none mt-2">
          Vinicius Peres
        </h1>
      </header>

      <section className="max-w-xl mb-12">
        <h2 className="font-poster text-2xl uppercase mb-3">
          {t.about.titleTop} {t.about.titleBottom}
        </h2>
        <p className="text-sm text-paper/80 leading-relaxed mb-3">{t.about.p1}</p>
        <p className="text-sm text-paper/80 leading-relaxed">{t.about.p2}</p>
      </section>

      <section className="max-w-xl mb-12 space-y-8">
        <div>
          <h2 className="font-poster text-2xl uppercase mb-2 text-[#16a030]">{t.ghost.title}</h2>
          <p className="text-xs text-paper/70 leading-relaxed mb-2">{t.ghost.intro}</p>
          <a className="text-[#16a030] underline text-sm" href={links.ghostApp} target="_blank" rel="noreferrer">
            {t.ghost.ready.play}
          </a>
        </div>
        <div>
          <h2 className="font-poster text-2xl uppercase mb-2 text-[#ff6b2b]">{t.verve.title}</h2>
          <p className="text-xs text-paper/70 leading-relaxed mb-2">{t.verve.p1}</p>
          <a className="text-[#ff6b2b] underline text-sm" href={links.verveSource} target="_blank" rel="noreferrer">
            {t.verve.source}
          </a>
        </div>
      </section>

      <footer className="text-sm space-x-6">
        <a className="text-amber underline" href={`mailto:${links.email}`}>{links.email}</a>
        <a className="underline" href={links.github} target="_blank" rel="noreferrer">GitHub</a>
        <a className="underline" href={links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
      </footer>
    </main>
  )
}

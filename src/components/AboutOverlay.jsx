import { useLang } from '../i18n/LanguageContext.jsx'
import { useReveal } from '../hooks/useReveal.js'

/**
 * View "about" da cena: a câmera aproxima do quadro na parede e o texto
 * vive direto sobre a parede escura à esquerda — sem caixa, tipografia
 * editorial como o resto do site.
 */
export function AboutOverlay({ onNavigate, onContact }) {
  const { t } = useLang()
  const a = t.about
  const [ref, visible] = useReveal(0.1)

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col p-6 sm:p-12 pt-24 sm:pt-28">
      <div className="pointer-events-auto">
        <button
          onClick={() => onNavigate('home')}
          className="font-mono text-xs sm:text-sm tracking-widest text-paper hover:text-amber transition-colors"
        >
          {t.ui.backToRoom}
        </button>
      </div>

      {/* texto sobre a parede escura; o quadro respira à direita */}
      <div className="flex flex-1 items-center">
        <div
          ref={ref}
          className={`pointer-events-auto max-w-md transition-all duration-700 ease-out ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="font-mono text-[10px] font-semibold tracking-[0.35em] text-amber/90">
            {t.sections.about}
          </span>
          <h2 className="mt-4 font-poster uppercase leading-[0.85] tracking-tight text-6xl sm:text-7xl drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)]">
            <span className="text-paper">{a.headTop}</span>
            <br />
            <span className="text-amber">{a.headBottom}</span>
          </h2>
          <div className="mt-6 h-px w-12 bg-amber/70" aria-hidden="true" />
          <p className="mt-5 max-w-sm font-mono text-xs sm:text-sm text-paper/85 leading-relaxed">
            {a.p1}
          </p>
          <p className="mt-4 max-w-sm font-mono text-[11px] sm:text-xs text-paper/55 leading-relaxed">
            {a.p2}
          </p>
          <button
            onClick={onContact}
            className="mt-8 border-2 border-amber px-5 py-3 font-mono text-xs font-bold text-amber hover:bg-amber hover:text-ink transition-colors"
          >
            {a.cta}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useLang } from '../i18n/LanguageContext.jsx'
import { useReveal } from '../hooks/useReveal.js'
import { links } from '../content/index.js'
import { GitHubIcon, LinkedInIcon } from './SocialIcons.jsx'

/**
 * View "about" da cena: a câmera aproxima do quadro na parede e o texto
 * vive direto sobre a parede escura à esquerda — sem caixa, tipografia
 * editorial como o resto do site.
 */
export function AboutOverlay({ onNavigate, onContact }) {
  const { t } = useLang()
  const a = t.about
  const [ref, visible] = useReveal(0.1)

  // Instagram fica só no footer (pedido do dono)
  const socials = [
    { label: 'GitHub', href: links.github, Icon: GitHubIcon },
    { label: 'LinkedIn', href: links.linkedin, Icon: LinkedInIcon },
  ]

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col p-6 sm:p-12 pt-24 sm:pt-28">
      {/* scrims de legibilidade: degradê à esquerda no desktop (texto mora lá),
          de baixo pra cima no mobile (texto ancora embaixo, foto respira em cima) */}
      <div
        className="absolute inset-0 -z-10 hidden sm:block"
        style={{
          background:
            'linear-gradient(100deg, rgba(10,10,15,0.82) 0%, rgba(10,10,15,0.55) 32%, rgba(10,10,15,0.14) 55%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 sm:hidden"
        style={{
          background:
            'linear-gradient(to top, rgba(10,10,15,0.9) 0%, rgba(10,10,15,0.72) 45%, rgba(10,10,15,0.2) 68%, transparent 82%)',
        }}
        aria-hidden="true"
      />

      <div className="pointer-events-auto">
        {/* p-3 -m-3: alvo de toque >=44px sem deslocar o layout */}
        <button
          onClick={() => onNavigate('home')}
          className="p-3 -m-3 font-mono text-xs sm:text-sm tracking-widest text-paper hover:text-amber transition-colors"
        >
          {t.ui.backToRoom}
        </button>
      </div>

      {/* mobile: foto no topo, texto embaixo; desktop: quadro à direita, texto centrado à esquerda */}
      <div className="flex flex-1 items-end pb-2 sm:items-center sm:pb-0">
        <div
          ref={ref}
          className={`pointer-events-auto max-w-md lg:max-w-lg transition-all duration-700 ease-out ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="font-mono text-[10px] sm:text-xs font-semibold tracking-[0.35em] text-amber/90">
            {t.sections.about}
          </span>
          <h2 className="mt-3 sm:mt-4 font-poster uppercase leading-[0.85] tracking-tight text-5xl sm:text-7xl lg:text-8xl drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)]">
            <span className="text-paper">{a.headTop}</span>
            <br />
            <span className="text-amber">{a.headBottom}</span>
          </h2>
          <div className="mt-4 sm:mt-6 h-px w-12 bg-amber/70" aria-hidden="true" />
          <p className="mt-4 sm:mt-5 max-w-sm lg:max-w-md font-mono text-sm sm:text-base text-paper/90 leading-relaxed">
            {a.p1}
          </p>
          <p className="mt-4 max-w-sm lg:max-w-md font-mono text-xs sm:text-sm text-paper/65 leading-relaxed">
            {a.p2}
          </p>

          {/* redes */}
          <div className="mt-5 sm:mt-7 flex items-center gap-6">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="text-paper/75 hover:text-amber transition-colors"
              >
                <s.Icon width={30} height={30} />
              </a>
            ))}
          </div>

          <button
            onClick={onContact}
            className="mt-6 sm:mt-8 border-2 border-amber px-5 py-3 font-mono text-xs sm:text-sm font-bold text-amber hover:bg-amber hover:text-ink transition-colors"
          >
            {a.cta}
          </button>
        </div>
      </div>
    </div>
  )
}

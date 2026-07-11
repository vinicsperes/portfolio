import { useLang } from '../i18n/LanguageContext.jsx'

const VIEW_META = [
  { id: 'about', pt: 'SOBRE', en: 'ABOUT', color: '#f5a623' },
  { id: 'ghost', pt: 'GHOST FX', en: 'GHOST FX', color: '#16a030' },
  { id: 'verve', pt: 'VERVE', en: 'VERVE', color: '#ff6b2b' },
]

/**
 * Navegação padrão de TODAS as views da cena: voltar ao quarto à esquerda,
 * as outras views à direita — sempre no mesmo lugar, sempre claro.
 */
export function SceneNav({ current, onNavigate }) {
  const { t, lang } = useLang()
  const others = VIEW_META.filter((v) => v.id !== current)

  return (
    <div className="pointer-events-auto flex items-center justify-between">
      <button
        onClick={() => onNavigate('home')}
        className="font-mono text-xs sm:text-sm tracking-widest text-paper hover:text-amber transition-colors"
      >
        {t.ui.backToRoom}
      </button>
      <div className="flex items-center gap-5">
        {others.map((v) => (
          <button
            key={v.id}
            onClick={() => onNavigate(v.id)}
            className="group font-mono text-xs sm:text-sm tracking-widest text-paper/55 transition-colors"
            style={{ '--vc': v.color }}
            onMouseEnter={(e) => (e.currentTarget.style.color = v.color)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            {v[lang]} →
          </button>
        ))}
      </div>
    </div>
  )
}

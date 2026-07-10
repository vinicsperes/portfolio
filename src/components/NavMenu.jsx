import { useLang } from '../i18n/LanguageContext.jsx'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

const ITEMS = [
  { id: 'top', pt: 'QUARTO', en: 'ROOM' },
  { id: 'about', pt: 'SOBRE', en: 'ABOUT' },
  { id: 'projects', pt: 'PROJETOS', en: 'PROJECTS' },
  { id: 'blog', pt: 'BLOG', en: 'BLOG' },
  { id: 'contact', pt: 'CONTATO', en: 'CONTACT' },
]

/**
 * Navegação HTML: âncoras para as seções da página rolável.
 * "QUARTO" volta ao topo (a cena 3D). Serve descoberta, touch e teclado.
 */
export function NavMenu() {
  const { lang } = useLang()
  const reducedMotion = useReducedMotion()
  const behavior = reducedMotion ? 'auto' : 'smooth'

  const go = (id) => {
    if (id === 'top') window.scrollTo({ top: 0, behavior })
    else document.getElementById(id)?.scrollIntoView({ behavior })
  }

  return (
    <nav
      aria-label={lang === 'pt' ? 'Seções do site' : 'Site sections'}
      className="pointer-events-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-1 font-mono text-[10px] sm:text-xs tracking-widest"
    >
      {ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => go(item.id)}
          className="text-paper/60 hover:text-amber focus-visible:text-amber transition-colors"
        >
          {item[lang]}
        </button>
      ))}
    </nav>
  )
}

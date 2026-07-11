import { useEffect, useState } from 'react'
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
 * "QUARTO" volta ao topo (a cena 3D); "SOBRE" abre a view do quadro na cena.
 * No mobile os itens não cabem na topbar: viram um painel atrás de "MENU".
 */
export function NavMenu({ onAbout }) {
  const { lang } = useLang()
  const reducedMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const behavior = reducedMotion ? 'auto' : 'smooth'

  // painel mobile fecha sozinho ao rolar a página ou com Escape
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('scroll', close, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (id) => {
    setOpen(false)
    if (id === 'top') window.scrollTo({ top: 0, behavior })
    else if (id === 'about') onAbout?.()
    else document.getElementById(id)?.scrollIntoView({ behavior })
  }

  return (
    <nav
      aria-label={lang === 'pt' ? 'Seções do site' : 'Site sections'}
      className="pointer-events-auto relative font-mono text-[10px] sm:text-xs tracking-widest"
    >
      {/* desktop: itens em linha */}
      <div className="hidden md:flex items-center gap-4">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => go(item.id)}
            className="text-paper/60 hover:text-amber focus-visible:text-amber transition-colors"
          >
            {item[lang]}
          </button>
        ))}
      </div>

      {/* mobile: um botão só; itens num painel embaixo */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`md:hidden border px-3 py-1.5 font-bold transition-colors ${
          open ? 'border-amber text-amber' : 'border-paper/30 text-paper/80'
        }`}
      >
        {open ? (lang === 'pt' ? 'FECHAR' : 'CLOSE') : 'MENU'}
      </button>
      {open && (
        <div className="md:hidden absolute right-0 top-full mt-2 flex w-44 flex-col border border-paper/15 bg-[#0a0a0f]/95 backdrop-blur-md">
          {ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              className="border-b border-paper/10 px-5 py-3 text-right text-paper/70 last:border-0 hover:text-amber focus-visible:text-amber transition-colors"
            >
              {item[lang]}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}

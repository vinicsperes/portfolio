import { useEffect, useRef } from 'react'
import { useLang } from '../i18n/LanguageContext.jsx'
import { SceneNav } from './SceneNav.jsx'

/**
 * View "ghost" da cena: puro easter egg — nada informativo aqui (a
 * apresentação vive na seção rolável). Só o pedal interativo, o scroll que
 * abre o chassi e um hint mínimo de affordance.
 */
export function GhostOverlay({ scrollRef, onNavigate }) {
  const { t } = useLang()
  const scrollEl = useRef(null)

  useEffect(() => {
    const el = scrollEl.current
    if (el) el.scrollTop = 0
    if (scrollRef) scrollRef.current.scroll = 0
  }, [scrollRef])

  const onScroll = (e) => {
    const el = e.currentTarget
    const max = el.scrollHeight - el.clientHeight
    const p = max > 0 ? el.scrollTop / max : 0
    if (scrollRef) scrollRef.current.scroll = p
  }

  return (
    <div className="absolute inset-0 z-20">
      {/* superfície de scroll: o scroll é o brinquedo (abre o chassi na cena) */}
      <div
        ref={scrollEl}
        onScroll={onScroll}
        className="no-scrollbar pointer-events-auto absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
      >
        <div className="h-[120vh]" aria-hidden="true" />
        <div className="h-[100vh]" aria-hidden="true" />
      </div>

      {/* navegação padrão da cena: fora do scroll, abaixo da topbar fixa —
          nunca cavalga o menu principal */}
      <div className="absolute inset-x-0 top-0 z-30 px-6 sm:px-12 pt-24 sm:pt-28">
        <SceneNav current="ghost" onNavigate={onNavigate} />
      </div>

      {/* hint mínimo de affordance */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 text-center">
        <span className="font-mono text-[10px] tracking-[0.3em] text-paper/40">
          {t.ghost.scene.hint}
        </span>
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'

/**
 * Progresso 0..1 de um container alto (ex.: 220vh) com filho sticky:
 * escreve num ref a cada scroll — sem re-render por frame.
 */
export function useSectionProgress() {
  const ref = useRef(null)
  const progress = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      progress.current = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return [ref, progress]
}

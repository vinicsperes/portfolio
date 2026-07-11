import { useEffect, useRef, useState } from 'react'

/**
 * Marca `visible` quando o elemento entra no viewport (uma vez só).
 * Uso: const [ref, visible] = useReveal(); <div ref={ref} data-visible={visible}>
 */
export function useReveal(threshold = 0.25) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        // qualquer entrada do batch intersectando conta — entries[0] pode ser
        // uma transição antiga escondendo a mais recente
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return [ref, visible]
}

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
      ([entry]) => {
        if (entry.isIntersecting) {
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

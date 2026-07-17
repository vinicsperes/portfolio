import { useEffect, useRef, useState } from 'react'

/** True enquanto o elemento está perto/dentro da viewport (com margem). */
export function useNearViewport(rootMargin = '400px') {
  const ref = useRef(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // sempre a ÚLTIMA entrada: o callback pode receber várias transições num
    // batch (scroll rápido/programático) e entries[0] é a mais ANTIGA —
    // ler só ela trava o estado no valor velho
    const io = new IntersectionObserver(
      (entries) => setNear(entries[entries.length - 1].isIntersecting),
      { rootMargin }
    )
    io.observe(el)
    // mesma rede de segurança do useReveal: um salto programático pode não
    // acordar o observer, e aí o canvas da seção nunca montaria
    const margin = parseInt(rootMargin, 10) || 0
    const tm = setTimeout(() => {
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight + margin && r.bottom > -margin) setNear(true)
    }, 900)
    return () => {
      io.disconnect()
      clearTimeout(tm)
    }
  }, [rootMargin])

  return [ref, near]
}

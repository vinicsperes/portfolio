import { useEffect, useRef, useState } from 'react'

/** True enquanto o elemento está perto/dentro da viewport (com margem). */
export function useNearViewport(rootMargin = '400px') {
  const ref = useRef(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])

  return [ref, near]
}

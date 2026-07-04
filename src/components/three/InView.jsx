import { useEffect, useRef, useState } from 'react'

/**
 * Monta os filhos só quando o container entra (perto d)a viewport e os
 * desmonta quando sai. Cada cena 3D tem seu próprio contexto WebGL; manter
 * apenas o visível ativo evita estourar o limite de contextos do navegador
 * (dois canvases pesados ao mesmo tempo deixam um deles preto) e alivia
 * dispositivos fracos.
 */
export function InView({ children, className, style, rootMargin = '0px', fallback = null }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])

  return (
    <div ref={ref} className={className} style={style}>
      {inView ? children : fallback}
    </div>
  )
}

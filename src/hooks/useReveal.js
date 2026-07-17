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
    let done = false
    const show = () => {
      if (done) return
      done = true
      setVisible(true)
      io.disconnect()
      clearInterval(tm)
    }
    const io = new IntersectionObserver(
      (entries) => {
        // qualquer entrada do batch intersectando conta — entries[0] pode ser
        // uma transição antiga escondendo a mais recente
        if (entries.some((e) => e.isIntersecting)) show()
      },
      { threshold }
    )
    io.observe(el)
    // Rede de segurança: quando a página chega por scroll PROGRAMÁTICO
    // (deep-link /#contact), o observer criado antes do salto não dispara e a
    // seção ficava em branco. Uma checagem de rect depois do layout assentar
    // revela o que já está na tela.
    // Roda até revelar: scrolls programáticos (deep-link, âncora, snap) podem
    // não acordar o observer. Um getBoundingClientRect a cada 700ms por
    // elemento ainda não revelado é desprezível, e para no primeiro show().
    const tm = setInterval(() => {
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight && r.bottom > 0) show()
    }, 700)
    return () => {
      io.disconnect()
      clearInterval(tm)
    }
  }, [threshold])

  return [ref, visible]
}

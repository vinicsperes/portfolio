import { useEffect, useState } from 'react'

/**
 * Qual seção o visitante está lendo AGORA.
 *
 * O observer olha uma faixa fina no meio da tela: o rootMargin corta 45% de
 * cima e 45% de baixo, sobrando uma linha de leitura de ~10% de altura. A
 * qualquer instante só a seção que cruza essa linha conta como ativa, então
 * não existe empate entre duas seções visíveis nem histerese na borda — que é
 * o que faz um scrollspy comum piscar entre dois itens.
 *
 * O callback lê TODAS as entradas do lote e fica com a última que está
 * intersectando. Um lote pode trazer várias transições (scroll rápido, salto
 * de âncora) e `entries[0]` é a mais ANTIGA: ler só ela prende o estado num
 * valor velho. Esse bug já apareceu no useNearViewport e no useReveal.
 *
 * `ids` precisa ser um array ESTÁVEL (const de módulo). Um literal novo a cada
 * render remontaria o observer a cada render.
 */
export function useActiveSection(ids) {
  const [active, setActive] = useState(null)

  useEffect(() => {
    const secoes = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!secoes.length) return

    const io = new IntersectionObserver(
      (entries) => {
        let ultima = null
        for (const e of entries) if (e.isIntersecting) ultima = e.target.id
        if (ultima) setActive(ultima)
      },
      { rootMargin: '-45% 0px -45% 0px' }
    )
    secoes.forEach((s) => io.observe(s))

    // Rede de segurança, mesma dos outros hooks daqui: um salto programático
    // (deep-link /#contact) pode não acordar o observer criado antes do salto,
    // e aí o rail nasceria sem nenhuma seção ativa.
    const tm = setTimeout(() => {
      const meio = window.innerHeight / 2
      const atual = secoes.find((s) => {
        const r = s.getBoundingClientRect()
        return r.top <= meio && r.bottom >= meio
      })
      if (atual) setActive((a) => a ?? atual.id)
    }, 600)

    return () => {
      io.disconnect()
      clearTimeout(tm)
    }
  }, [ids])

  return active
}

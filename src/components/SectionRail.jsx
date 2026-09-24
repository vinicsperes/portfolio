import { useEffect, useRef, useState } from 'react'
import { useActiveSection } from '../hooks/useActiveSection.js'
import { useLang } from '../i18n/LanguageContext.jsx'

/**
 * Ordem das paradas, de cima pra baixo, igual à página. Precisa ser const de
 * MÓDULO: o useActiveSection remonta o observer quando essa referência muda.
 */
const IDS = ['top', 'projects', 'ghost', 'verve', 'contact']

/**
 * Navegação da página, em duas apresentações que dividem o mesmo estado.
 *
 * A página tem cinco telas e, antes disto, o único índice dela morava no
 * rodapé — ou seja, o visitante só descobria o mapa do site depois de já ter
 * passado por ele inteiro. Não havia como saber onde se está, o que vem, nem
 * como chegar no contato sem rolar tudo.
 *
 * DESKTOP: um trilho na borda direita. Diz onde você está (traço âmbar),
 * quanto falta (a linha de progresso na borda) e leva direto a qualquer seção.
 * Os rótulos aparecem no hover, não fixos: rótulo fixo mede ~85px e, numa tela
 * de 1280, o conteúdo (max-w-6xl + px-12) já começa a 112px da borda. Ficaria
 * por cima do texto das seções. Para leitor de tela eles estão sempre no DOM.
 *
 * CELULAR: uma barra fina no topo. O trilho não serve aqui — não há borda
 * sobrando e o alvo de toque seria de 1px — e sem ela o celular ficava com
 * ZERO navegação, só o rodapé no fim de tudo. É justamente de onde vem quem
 * clica pelo Instagram, que foi o caso que motivou a moeda estática do
 * index.html. A barra diz a seção atual, o progresso vira um fio no topo da
 * tela, e o índice completo abre num toque.
 *
 * As duas somem no hero, porque lá a cena 3D é o assunto e a página já tem a
 * seta de "role para explorar".
 */
export function SectionRail({ hidden = false }) {
  const { t } = useLang()
  const active = useActiveSection(IDS)
  const fillRef = useRef(null)
  const barraRef = useRef(null)
  const [aberto, setAberto] = useState(false)

  // Progresso escrito DIRETO no style, via rAF, nas duas apresentações. Passar
  // isto por estado seria um re-render por frame de scroll, e o hero já divide
  // a main thread com a cena 3D.
  useEffect(() => {
    let raf = 0
    const escreve = () => {
      raf = 0
      const rolavel = document.documentElement.scrollHeight - window.innerHeight
      const p = rolavel > 0 ? Math.min(1, Math.max(0, window.scrollY / rolavel)) : 0
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${p})`
      if (barraRef.current) barraRef.current.style.transform = `scaleX(${p})`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(escreve)
    }
    escreve()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const paradas = [
    { id: 'top', label: t.ui.top },
    { id: 'projects', label: t.sections.projects },
    { id: 'ghost', label: 'GHOSTFX' },
    { id: 'verve', label: 'VERVE' },
    { id: 'contact', label: t.sections.contact },
  ]

  // No hero a navegação não existe; fora da home (overlay do about) também não.
  const visivel = !hidden && active != null && active !== 'top'
  const atual = paradas.find((p) => p.id === active)

  // o painel some junto com a barra: deixar ele aberto ao voltar pro hero
  // devolveria o visitante a uma lista flutuando sobre a cena
  useEffect(() => {
    if (!visivel) setAberto(false)
  }, [visivel])

  useEffect(() => {
    if (!aberto) return
    const onKey = (e) => e.key === 'Escape' && setAberto(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto])

  return (
    <>
      {/* ─────────── desktop: trilho na borda ─────────── */}
      <nav
        aria-label={t.ui.sectionNav}
        className={`group fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 pr-5 transition-all duration-500 ease-out md:block motion-reduce:transition-none ${
          visivel ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-4 opacity-0'
        }`}
      >
        <div className="flex items-stretch gap-3">
          <ul className="flex flex-col gap-5">
            {paradas.map((p) => {
              const ativo = p.id === active
              return (
                <li key={p.id}>
                  <a
                    href={`#${p.id}`}
                    aria-current={ativo ? 'true' : undefined}
                    className="flex items-center justify-end gap-3 py-1"
                  >
                    <span
                      className={`whitespace-nowrap font-mono text-[10px] font-bold tracking-[0.2em] opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100 motion-reduce:transition-none ${
                        ativo ? 'text-amber' : 'text-paper/70'
                      } translate-x-2`}
                    >
                      {p.label}
                    </span>
                    {/* o traço É o indicador: curto e apagado em repouso, largo e
                        âmbar na seção atual. Some largura no hover pra dizer que
                        é clicável sem precisar do rótulo */}
                    <span
                      aria-hidden="true"
                      className={`h-px transition-all duration-300 ease-out motion-reduce:transition-none ${
                        ativo
                          ? 'w-7 bg-amber'
                          : 'w-3.5 bg-paper/35 group-hover:w-5 group-hover:bg-paper/70'
                      }`}
                    />
                  </a>
                </li>
              )
            })}
          </ul>
          {/* quanto falta de página, na borda da tela */}
          <div className="relative w-px bg-paper/15" aria-hidden="true">
            <div
              ref={fillRef}
              className="absolute inset-x-0 top-0 h-full origin-top bg-amber/80"
              style={{ transform: 'scaleY(0)' }}
            />
          </div>
        </div>
      </nav>

      {/* ─────────── celular: barra no topo ─────────── */}
      <div
        className={`fixed inset-x-0 top-0 z-40 transition-transform duration-300 ease-out md:hidden motion-reduce:transition-none ${
          visivel ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* o progresso É o fio no topo da tela: não ocupa linha própria */}
        <div className="h-0.5 w-full bg-paper/10" aria-hidden="true">
          <div
            ref={barraRef}
            className="h-full w-full origin-left bg-amber"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
        <nav
          aria-label={t.ui.sectionNav}
          className="flex items-center justify-between border-b border-paper/10 bg-[#0a0a0f]/95 px-6 py-3"
        >
          <span className="font-mono text-[10px] font-bold tracking-[0.25em] text-amber">
            {atual?.label ?? ''}
          </span>
          <button
            onClick={() => setAberto((a) => !a)}
            aria-expanded={aberto}
            aria-controls="indice-secoes"
            className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.25em] text-paper/70"
          >
            {t.ui.index}
            <span
              aria-hidden="true"
              className={`transition-transform duration-300 motion-reduce:transition-none ${
                aberto ? 'rotate-180' : ''
              }`}
            >
              ↓
            </span>
          </button>
        </nav>
        <ul id="indice-secoes" hidden={!aberto} className="border-b border-paper/10 bg-[#0a0a0f] px-6 pb-4">
          {paradas.map((p) => (
            <li key={p.id}>
              <a
                href={`#${p.id}`}
                onClick={() => setAberto(false)}
                aria-current={p.id === active ? 'true' : undefined}
                className={`flex items-center justify-between border-b border-paper/5 py-3 font-mono text-xs tracking-[0.2em] ${
                  p.id === active ? 'text-amber' : 'text-paper/70'
                }`}
              >
                {p.label}
                {p.id === active && <span aria-hidden="true" className="h-px w-5 bg-amber" />}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

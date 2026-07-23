import { useEffect, useState } from 'react'

/**
 * Loader minimalista: uma barra fina que preenche suavemente e some quando a
 * cena está PRONTA de verdade (`ready`, vindo do Suspense da Scene) — não
 * depende do `useProgress`, que numa cena leve reporta 100 de cara e oscila
 * (era a origem do flicker). Fallback por tempo caso o sinal não chegue.
 */
export function BootLoader({ ready = false }) {
  const [mounted, setMounted] = useState(false) // dispara a animação de entrada
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(r)
  }, [])

  // some quando a cena fica pronta (garante um mínimo visível pela animação)
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setFading(true), 260)
    return () => clearTimeout(t)
  }, [ready])

  // fallback: se "ready" nunca vier, não trava o loader
  useEffect(() => {
    const t = setTimeout(() => setFading(true), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!fading) return
    const t = setTimeout(() => setGone(true), 500)
    return () => clearTimeout(t)
  }, [fading])

  if (gone) return null

  // barra: 0 → 88% enquanto carrega (ease longo), 100% quando pronto
  const width = fading || ready ? 100 : mounted ? 88 : 0

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a0f] transition-opacity duration-700 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      {/* palco 3D: globo girando num sentido (extrusão FINA) + elipse externa
          contra-rotativa com gap (efeito giroscópio). perspective no container
          dá a profundidade + barra como rodapé do lockup */}
      <div
        className={`flex w-52 sm:w-72 flex-col items-stretch gap-6 transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        {/* perspective no palco (e SEM preserve-3d aqui): assim o globo e o anel
            NÃO se intercalam em Z; cada um é 3D por dentro, mas o anel (depois no
            DOM) compõe sempre POR CIMA do globo na hora que se cruzam ao girar */}
        <div className="relative w-full" style={{ aspectRatio: '1904 / 906', perspective: '1000px' }}>
          {/* globo extrudado FINO (~5px), menor, deixando a órbita do anel em
              volta. filter inline SUBSTITUI o da classe, então invert vai junto */}
          <div className="loader-spin absolute" style={{ inset: '18%' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <img
                key={i}
                src="/peres-globe-white.svg"
                alt=""
                className="absolute inset-0 h-full w-full"
                // SVG já branco: ZERO filtro (invert por camada torrava a GPU no
                // mobile). Profundidade fake via opacity, que é compositor-only
                style={{
                  transform: `translateZ(${(i - 2.5) * 1}px)`,
                  opacity: 0.55 + 0.45 * (i / 5),
                }}
              />
            ))}
          </div>
          {/* anel EXTERNO (elipse por fora do globo) extrudado na MESMA espessura,
              girando ao contrário. só um pouco maior que o globo (gap pequeno) */}
          <div
            className="loader-spin-rev absolute"
            style={{ inset: '14%' }}
            aria-hidden="true"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-[50%] border-2"
                style={{
                  transform: `translateZ(${(i - 2) * 1.1}px)`,
                  borderColor: `rgba(244,240,230,${0.45 + 0.5 * (i / 4)})`,
                }}
              />
            ))}
          </div>
        </div>
        <div className="h-px w-full bg-paper/20 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-paper"
            style={{ width: `${width}%`, transition: `width ${ready ? 300 : 2200}ms ease-out` }}
          />
        </div>
      </div>
    </div>
  )
}

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
      {/* logo (globo) girando no eixo Y com ESPESSURA real: N cópias do SVG
          empilhadas em translateZ (extrusão) dentro de um pai preserve-3d.
          perspective dá a profundidade + barra como rodapé do lockup */}
      <div
        className={`flex w-52 sm:w-72 flex-col items-stretch gap-6 transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
        style={{ perspective: '1000px' }}
      >
        <div className="loader-spin relative w-full" style={{ aspectRatio: '1904 / 906' }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <img
              key={i}
              src="/peres-globe.svg"
              alt=""
              className="absolute inset-0 h-full w-full"
              // invert (preto->branco) + brilho decrescente pro fundo (AO fake).
              // filter inline SUBSTITUI o da classe, então invert vai junto aqui
              style={{
                transform: `translateZ(${(i - 7.5) * 1.7}px)`,
                filter: `invert(1) brightness(${0.72 + 0.28 * (i / 15)})`,
              }}
            />
          ))}
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

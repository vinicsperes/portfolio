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
      <div className="flex flex-col items-center gap-7">
        {/* wordmark do PERES entrando suave sobre a barra */}
        <img
          src="/peres-stamp-wordmark.svg"
          alt=""
          className={`h-12 sm:h-16 w-auto invert transition-all duration-700 ease-out ${
            mounted ? 'opacity-90 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        />
        <div className="w-48 sm:w-64 h-px bg-paper/15 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-amber"
            style={{ width: `${width}%`, transition: `width ${ready ? 300 : 2200}ms ease-out` }}
          />
        </div>
      </div>
    </div>
  )
}

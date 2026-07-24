import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

// mínimo girando antes de "cair", mesmo se a cena carregar antes (padroniza o
// loader em loads rápidos: dá pra ver a moeda girar)
const MIN_MS = 1500
// desaceleração da "queda" até parar de frente (bate com loader-coin-land no css)
const LAND_MS = 600
// no instante que para: piscadinha com brilho + revela o site (rápido, sem
// aquele tempo parada que dava ansiedade). bate com loader-coin-flash no css
const FLASH_MS = 380
// teto de segurança: se 'ready' nunca chegar, não trava o loader pra sempre
const MAX_MS = 6000

/**
 * Loader: a logo gira rápido como uma MOEDA (rotateY, uma imagem raster só = leve
 * no mobile). Quando a cena está pronta (`ready`, do Suspense da Scene) e já girou
 * o mínimo, a moeda "cai" (desacelera até de frente) e no instante que para dá uma
 * piscadinha com brilho, revelando o site. Barra fina e discreta embaixo.
 */
export function BootLoader({ ready = false, onReveal }) {
  const reducedMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false) // dispara a animação de entrada
  const [landing, setLanding] = useState(false) // desacelera até parar de frente
  const [ending, setEnding] = useState(false) // piscada com brilho + revela site
  const [gone, setGone] = useState(false)
  const mountAt = useRef(performance.now())

  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(r)
  }, [])

  // pronto + girou o mínimo → a moeda cai (desacelera)
  useEffect(() => {
    if (!ready) return
    const wait = Math.max(0, MIN_MS - (performance.now() - mountAt.current))
    const t = setTimeout(() => setLanding(true), wait)
    return () => clearTimeout(t)
  }, [ready])

  // fallback: se 'ready' nunca vier, cai no teto pra não travar
  useEffect(() => {
    const t = setTimeout(() => setLanding(true), MAX_MS)
    return () => clearTimeout(t)
  }, [])

  // parou de frente → piscadinha + revela (sem tempo parada)
  useEffect(() => {
    if (!landing) return
    const t = setTimeout(() => setEnding(true), LAND_MS)
    return () => clearTimeout(t)
  }, [landing])

  // a cena volta a renderizar agora (por trás do fade), pra revelar já pintada
  useEffect(() => {
    if (ending) onReveal?.()
  }, [ending, onReveal])

  useEffect(() => {
    if (!ending) return
    const t = setTimeout(() => setGone(true), FLASH_MS)
    return () => clearTimeout(t)
  }, [ending])

  if (gone) return null

  // barra: 0 → 88% enquanto carrega (ease longo), 100% quando pronto
  const width = ending || ready ? 100 : mounted ? 88 : 0

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a0f] transition-opacity duration-300 ${
        ending ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      <div
        className={`flex w-52 sm:w-72 flex-col items-center gap-8 transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
        style={{ perspective: '900px' }}
      >
        {/* moeda: gira rápido no eixo Y; ao "cair" (landing) desacelera até de
            frente, e no fim (ending) dá a piscadinha com brilho e some. PNG
            (raster): o SVG re-rasterizava a cada ângulo da rotação 3D e travava */}
        <img
          src="/peres-globe-white.png"
          alt=""
          aria-hidden="true"
          className={`w-3/4 ${
            reducedMotion ? '' : ending ? 'loader-coin flash' : landing ? 'loader-coin landing' : 'loader-coin'
          }`}
        />
        {/* barra discreta (a moeda é o foco) */}
        <div className="h-px w-full bg-paper/10 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-paper/40"
            style={{ width: `${width}%`, transition: `width ${ready ? 300 : 2200}ms ease-out` }}
          />
        </div>
      </div>
    </div>
  )
}

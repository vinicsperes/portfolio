import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import './materials.jsx'

/**
 * Reel procedural do monitor: cicla "slides" dos trabalhos no CRT —
 * verve digitando sozinho, ident do Ghost FX com as cores dos presets e
 * cartão de identidade. Tudo desenhado num canvas 2D offscreen a ~10fps
 * (o upload da textura é o custo; 10fps é imperceptível num CRT) e
 * distorcido pelo crtMaterial (barril, scanlines, flicker, glitch).
 */

const SLIDE_MS = 7000
const FADE_MS = 450

// paleta do TUI real do verve
const VERVE = {
  bg: '#141013',
  border: '#413c3e',
  dim: '#6f6a66',
  upcoming: '#565250',
  bright: '#ddd8cf',
  accent: '#ff6b2b',
}

const VERVE_WORDS = ['typing', 'speed', 'terminal', 'rust', 'flow', 'rhythm', 'verve']

// presets do Ghost FX — nome + cor de acento (mesma vibe do app)
const GHOST_PRESETS = [
  { name: 'GHOST', color: '#20f040' },
  { name: 'DOOM', color: '#ff3b30' },
  { name: 'FROST', color: '#7fd7ff' },
  { name: 'HEAVY', color: '#b44dff' },
  { name: 'HAZE', color: '#ff5db1' },
  { name: 'FEVER', color: '#ff9500' },
]

function drawVerveSlide(ctx, W, H, now) {
  ctx.fillStyle = VERVE.bg
  ctx.fillRect(0, 0, W, H)
  const pad = 64
  ctx.textBaseline = 'top'

  // header: ● verve
  ctx.fillStyle = VERVE.accent
  ctx.beginPath()
  ctx.arc(pad + 9, pad + 24, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = VERVE.bright
  ctx.font = '700 46px "IBM Plex Mono", monospace'
  ctx.fillText('verve', pad + 38, pad)
  ctx.fillStyle = VERVE.dim
  ctx.font = '500 26px "IBM Plex Mono", monospace'
  ctx.fillText('a typing test in your terminal — Rust', pad, pad + 76)

  // caixa com digitação fantasma em loop
  const boxY = pad + 140
  const boxH = 300
  ctx.strokeStyle = VERVE.border
  ctx.lineWidth = 2
  ctx.strokeRect(pad, boxY, W - pad * 2, boxH)

  const CYCLE = 2200
  const word = VERVE_WORDS[Math.floor(now / CYCLE) % VERVE_WORDS.length]
  const prog = (now % CYCLE) / CYCLE
  const shown = word.slice(0, Math.floor(Math.min(1, prog * 1.6) * word.length))
  ctx.font = '500 44px "IBM Plex Mono", monospace'
  ctx.fillStyle = VERVE.bright
  ctx.fillText(shown, pad + 40, boxY + 48)
  ctx.fillStyle = VERVE.upcoming
  ctx.fillText(word.slice(shown.length), pad + 40 + ctx.measureText(shown).width, boxY + 48)
  if (Math.floor(now / 530) % 2 === 0) {
    const w = ctx.measureText(shown).width
    ctx.fillStyle = VERVE.bright
    ctx.fillRect(pad + 40 + w + 4, boxY + 46, 3, 50)
  }

  // wpm fake subindo com a digitação
  const wpm = 62 + Math.round(Math.sin(now / 1400) * 9 + prog * 14)
  ctx.fillStyle = VERVE.accent
  ctx.beginPath()
  ctx.arc(pad + 7, boxY + boxH + 62, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = VERVE.bright
  ctx.font = '600 30px "IBM Plex Mono", monospace'
  ctx.fillText(`${wpm} wpm`, pad + 28, boxY + boxH + 46)
}

function drawGhostSlide(ctx, W, H, now) {
  ctx.fillStyle = '#0a0d0a'
  ctx.fillRect(0, 0, W, H)
  ctx.textBaseline = 'top'

  const preset = GHOST_PRESETS[Math.floor(now / 2600) % GHOST_PRESETS.length]

  // wordmark GHOSTFX (Saira 800 — fonte já carregada pelo site)
  ctx.font = '800 110px "Saira", sans-serif'
  ctx.fillStyle = '#e7e4dc'
  ctx.fillText('GHOST', 90, 110)
  const gw = ctx.measureText('GHOST').width
  ctx.fillStyle = preset.color
  ctx.fillText('FX', 90 + gw, 110)

  ctx.fillStyle = '#8a8a82'
  ctx.font = '500 28px "IBM Plex Mono", monospace'
  ctx.fillText('a guitar pedal in your browser', 94, 250)

  // "forma de onda": barras pulsando na cor do preset
  const barY = 400
  const barMaxH = 190
  const n = 28
  const span = W - 180
  for (let i = 0; i < n; i++) {
    const x = 90 + (i / (n - 1)) * span
    const h =
      barMaxH *
      (0.25 +
        0.75 *
          Math.abs(
            Math.sin(now / 380 + i * 0.55) * 0.6 + Math.sin(now / 190 + i * 1.3) * 0.4
          ))
    ctx.fillStyle = preset.color
    ctx.globalAlpha = 0.28 + 0.72 * (h / barMaxH)
    ctx.fillRect(x, barY + (barMaxH - h), 16, h)
  }
  ctx.globalAlpha = 1

  // nome do preset atual, como no seletor do app
  ctx.fillStyle = preset.color
  ctx.font = '700 40px "Saira", sans-serif'
  ctx.fillText(preset.name, 94, 650)
  ctx.fillStyle = '#565650'
  ctx.font = '500 24px "IBM Plex Mono", monospace'
  ctx.fillText('6 voiced presets · Web Audio API', 94, 706)
}

function drawIdentSlide(ctx, W, H, now) {
  ctx.fillStyle = '#101014'
  ctx.fillRect(0, 0, W, H)
  ctx.textBaseline = 'top'

  ctx.fillStyle = '#8a8a82'
  ctx.font = '500 26px "IBM Plex Mono", monospace'
  ctx.fillText('> whoami', 90, 130)

  ctx.fillStyle = '#e7e4dc'
  ctx.font = '800 96px "Saira", sans-serif'
  ctx.fillText('VINICIUS', 90, 200)
  ctx.fillText('PERES', 90, 310)

  ctx.fillStyle = '#f5a623'
  ctx.font = '600 30px "IBM Plex Mono", monospace'
  ctx.fillText('fullstack creative dev', 94, 460)

  ctx.fillStyle = '#565650'
  ctx.font = '500 24px "IBM Plex Mono", monospace'
  ctx.fillText('code · audio · 3d', 94, 530)

  // cursor de terminal piscando
  if (Math.floor(now / 530) % 2 === 0) {
    ctx.fillStyle = '#e7e4dc'
    ctx.fillRect(94, 620, 22, 40)
  }
}

const SLIDES = [drawVerveSlide, drawGhostSlide, drawIdentSlide]

/** Ruído de estática na transição entre slides. */
function drawStatic(ctx, W, H, strength) {
  const rows = 40
  for (let i = 0; i < rows; i++) {
    const y = Math.random() * H
    const h = 2 + Math.random() * 10
    const g = Math.floor(30 + Math.random() * 120)
    ctx.fillStyle = `rgba(${g},${g},${g},${0.25 * strength})`
    ctx.fillRect(0, y, W, h)
  }
}

export function MonitorReel() {
  const crt = useRef()
  const lastDraw = useRef(0)
  const { canvas, ctx, texture } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 800
    const ctx = canvas.getContext('2d')
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return { canvas, ctx, texture }
  }, [])

  useFrame(({ clock }) => {
    if (crt.current) crt.current.uTime = clock.elapsedTime

    // ~10fps: suficiente pra CRT e barato (o custo real é o upload da textura)
    const now = performance.now()
    if (now - lastDraw.current < 100) return
    lastDraw.current = now

    const W = canvas.width
    const H = canvas.height
    const idx = Math.floor(now / SLIDE_MS) % SLIDES.length
    SLIDES[idx](ctx, W, H, now)

    // estática nos primeiros/últimos ms de cada slide
    const inSlide = now % SLIDE_MS
    if (inSlide < FADE_MS) drawStatic(ctx, W, H, 1 - inSlide / FADE_MS)
    else if (inSlide > SLIDE_MS - FADE_MS) drawStatic(ctx, W, H, (inSlide - (SLIDE_MS - FADE_MS)) / FADE_MS)

    texture.needsUpdate = true
  })

  return (
    <mesh>
      <planeGeometry args={[1.9, 1.48]} />
      <crtMaterial ref={crt} toneMapped={false} uHasMap={1.0} uMap={texture} uHeat={0} />
    </mesh>
  )
}

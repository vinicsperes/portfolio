import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import './materials.jsx'

const WORDS_POOL = [
  'rust', 'terminal', 'speed', 'typing', 'words', 'wpm', 'accuracy', 'record',
  'confetti', 'keyboard', 'layout', 'cargo', 'binary', 'session', 'best',
  'lightning', 'focus', 'minimal', 'pixel', 'cursor', 'buffer', 'stdout',
  'crossterm', 'ratatui', 'thread', 'signal', 'cache', 'clean', 'fast',
  'ghost', 'verve', 'rhythm', 'flow', 'matrix', 'neon', 'retro', 'build',
]

const BEST_KEY = 'vinicsperes.verve.best'

function pickWords(n) {
  const out = []
  const pool = [...WORDS_POOL]
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    out.push(pool.splice(idx, 1)[0])
  }
  return out
}

function loadBest() {
  try {
    return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0
  } catch {
    return 0
  }
}

function saveBest(v) {
  try {
    localStorage.setItem(BEST_KEY, String(v))
  } catch {
    /* ignore */
  }
}

const CONFETTI_COLORS = ['#ff6b2b', '#f5a623', '#4dff7c', '#5ad1ff', '#ff5db1']
const IDLE_WORDS = ['typing', 'speed', 'terminal', 'rust', 'flow', 'rhythm']

/**
 * Simulação jogável do `verve` rodando DENTRO do monitor do PC.
 * `mode='live'`: teste de digitação real (teclado global, WPM/acurácia ao
 * vivo, confete no recorde). `mode='idle'`: attract-mode a ~10fps convidando
 * a clicar no computador — sem listener de teclado.
 * A textura passa pelo crtMaterial (barril, scanlines, flicker, fogo no topo).
 */
export function VerveTerminal({ mode = 'idle', statsRef, idleText }) {
  const crt = useRef()
  const { canvas, ctx, texture } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 800
    const ctx = canvas.getContext('2d')
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return { canvas, ctx, texture }
  }, [])

  const stateRef = useRef(null)
  const confettiRef = useRef([])
  const lastTime = useRef(0)
  const lastIdleDraw = useRef(0)
  const lastLiveDraw = useRef(0)

  const reset = () => {
    const words = pickWords(25)
    stateRef.current = {
      words,
      typedWords: [],
      wordIndex: 0,
      typed: '',
      startTime: null,
      finished: false,
      wpm: 0,
      acc: 100,
      best: loadBest(),
    }
    confettiRef.current = []
  }

  const computeStats = (s, now) => {
    let completedCorrect = 0
    let completedTotal = 0
    for (let i = 0; i < s.typedWords.length; i++) {
      const target = s.words[i]
      const typed = s.typedWords[i]
      completedTotal += typed.length
      const len = Math.max(target.length, typed.length)
      for (let c = 0; c < len; c++) {
        if (typed[c] === target[c]) completedCorrect++
      }
    }
    const target = s.words[s.wordIndex] || ''
    let curCorrect = 0
    const curLen = Math.min(s.typed.length, target.length)
    for (let c = 0; c < curLen; c++) {
      if (s.typed[c] === target[c]) curCorrect++
    }
    const correct = completedCorrect + curCorrect
    const total = completedTotal + s.typed.length
    const minutes = s.startTime ? (now - s.startTime) / 60000 : 0
    const wpm = minutes > 0 ? (correct / 5) / minutes : 0
    const acc = total > 0 ? (correct / total) * 100 : 100
    return { wpm, acc, correct, total }
  }

  const advanceWord = (s) => {
    s.typedWords.push(s.typed)
    s.typed = ''
    s.wordIndex++
    if (s.wordIndex >= s.words.length) {
      s.finished = true
      const now = performance.now()
      const { wpm } = computeStats(s, now)
      s.wpm = Math.round(wpm)
      if (s.wpm > s.best) {
        s.best = s.wpm
        saveBest(s.best)
        spawnConfetti()
      }
    }
  }

  const spawnConfetti = () => {
    const parts = []
    for (let i = 0; i < 90; i++) {
      parts.push({
        x: 512 + (Math.random() - 0.5) * 200,
        y: 300 + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 380,
        vy: -Math.random() * 520 - 120,
        size: 4 + Math.random() * 7,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 8,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        life: 1.6 + Math.random() * 0.8,
      })
    }
    confettiRef.current = parts
  }

  useEffect(() => {
    if (mode !== 'live') return
    reset()

    // lógica compartilhada entre teclado físico e input touch (evento 'verve:key')
    const handleKey = (key, ctrlKey = false) => {
      const s = stateRef.current
      if (!s) return
      if (key === 'Tab') {
        reset()
        return
      }
      if (s.finished) return
      if (key === 'Backspace') {
        s.typed = ctrlKey ? '' : s.typed.slice(0, -1)
        return
      }
      if (key === ' ') {
        if (s.typed.length > 0) advanceWord(s)
        return
      }
      if (key.length === 1) {
        if (!s.startTime) s.startTime = performance.now()
        s.typed += key
      }
    }

    const onKey = (e) => {
      if (e.key === 'Tab' || e.key === 'Backspace' || e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        handleKey(e.code === 'Space' ? ' ' : e.key, e.ctrlKey)
        return
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        handleKey(e.key)
      }
    }
    const onCustom = (e) => handleKey(e.detail?.key ?? '', false)

    window.addEventListener('keydown', onKey)
    window.addEventListener('verve:key', onCustom)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('verve:key', onCustom)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const drawLive = () => {
    const s = stateRef.current
    if (!s) return
    const now = performance.now()
    const stats = computeStats(s, now)

    // publish live stats for the HTML overlay
    if (statsRef) {
      statsRef.current = {
        wpm: Math.round(stats.wpm),
        acc: Math.round(stats.acc),
        time: s.startTime ? (now - s.startTime) / 1000 : 0,
        best: s.best,
        finished: s.finished,
      }
    }

    // background (scanlines vêm do crtMaterial)
    ctx.fillStyle = '#070b08'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const pad = 46
    ctx.textBaseline = 'top'

    // title
    ctx.fillStyle = '#4dff7c'
    ctx.font = '700 40px "IBM Plex Mono", monospace'
    ctx.fillText('verve', pad, pad)
    ctx.fillStyle = '#3a6f4a'
    ctx.font = '500 18px "IBM Plex Mono", monospace'
    ctx.fillText('v0.1.0  ·  type the words', pad + 130, pad + 16)

    // stats line
    const statsY = pad + 70
    const t = s.startTime ? ((now - s.startTime) / 1000).toFixed(1) : '0.0'
    const line = `WPM ${Math.round(stats.wpm).toString().padStart(3, ' ')}   ACC ${Math.round(stats.acc)
      .toString()
      .padStart(3, ' ')}%   TIME ${t.padStart(5, ' ')}s   BEST ${s.best.toString().padStart(3, ' ')}`
    ctx.fillStyle = '#9be8b4'
    ctx.font = '600 24px "IBM Plex Mono", monospace'
    ctx.fillText(line, pad, statsY)

    if (s.finished) {
      ctx.fillStyle = '#f5a623'
      ctx.font = '700 28px "IBM Plex Mono", monospace'
      ctx.fillText('— run complete · press TAB to restart —', pad, statsY + 44)
    }

    // words area
    const startY = statsY + 110
    ctx.font = '600 34px "IBM Plex Mono", monospace'
    const lineH = 52
    const maxX = canvas.width - pad
    let x = pad
    let y = startY

    const drawChar = (ch, color, underline) => {
      const w = ctx.measureText(ch).width
      ctx.fillStyle = color
      ctx.fillText(ch, x, y)
      if (underline) {
        ctx.fillStyle = '#ff4d4d'
        ctx.fillRect(x, y + 40, w, 3)
      }
      x += w
    }

    for (let i = 0; i < s.words.length; i++) {
      const target = s.words[i]
      const isCurrent = i === s.wordIndex
      const typed = isCurrent ? s.typed : s.typedWords[i] || ''

      // measure whole word first to know if it fits
      const wordW = ctx.measureText(target).width
      const gap = ctx.measureText(' ').width
      if (x + wordW > maxX && x > pad) {
        x = pad
        y += lineH
      }
      if (y > canvas.height - 60) break

      for (let c = 0; c < target.length; c++) {
        let color = '#33523f' // not yet typed
        let underline = false
        if (c < typed.length) {
          if (typed[c] === target[c]) color = '#4dff7c'
          else {
            color = '#ff7a7a'
            underline = true
          }
        } else if (isCurrent) {
          color = '#5fae74'
        }
        drawChar(target[c], color, underline)
      }
      // extra typed chars beyond target length (errors)
      if (typed.length > target.length) {
        for (let c = target.length; c < typed.length; c++) {
          drawChar(typed[c], '#ff7a7a', true)
        }
      }
      if (isCurrent && !s.finished) {
        // caret
        const caretX = x
        if (Math.floor(now / 530) % 2 === 0) {
          ctx.fillStyle = '#f5a623'
          ctx.fillRect(caretX, y, 3, 38)
        }
      }
      x += gap
    }

    // confetti
    const dt = lastTime.current ? (now - lastTime.current) / 1000 : 0
    lastTime.current = now
    const parts = confettiRef.current
    if (parts.length) {
      for (const p of parts) {
        p.vy += 900 * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rot += p.vr * dt
        p.life -= dt
        if (p.life > 0) {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.globalAlpha = Math.min(1, p.life)
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
          ctx.restore()
        }
      }
      confettiRef.current = parts.filter((p) => p.life > 0 && p.y < canvas.height + 40)
    }

    texture.needsUpdate = true
  }

  const drawIdle = (now) => {
    ctx.fillStyle = '#070b08'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const pad = 64
    ctx.textBaseline = 'top'

    // logo grande
    ctx.fillStyle = '#4dff7c'
    ctx.font = '700 110px "IBM Plex Mono", monospace'
    ctx.fillText('verve', pad, 140)

    ctx.fillStyle = '#3a6f4a'
    ctx.font = '500 30px "IBM Plex Mono", monospace'
    ctx.fillText(idleText?.line1 ?? 'a typing test in your terminal', pad, 290)

    // digitação fantasma em loop
    const CYCLE = 2400
    const word = IDLE_WORDS[Math.floor(now / CYCLE) % IDLE_WORDS.length]
    const prog = (now % CYCLE) / CYCLE
    const shown = word.slice(0, Math.floor(Math.min(1, prog * 1.6) * word.length))
    ctx.fillStyle = '#33523f'
    ctx.font = '600 44px "IBM Plex Mono", monospace'
    ctx.fillText('> ', pad, 420)
    ctx.fillStyle = '#4dff7c'
    ctx.fillText(shown, pad + 56, 420)
    if (Math.floor(now / 530) % 2 === 0) {
      const w = ctx.measureText(shown).width
      ctx.fillStyle = '#f5a623'
      ctx.fillRect(pad + 56 + w + 6, 420, 4, 44)
    }

    // convite
    ctx.fillStyle = '#f5a623'
    ctx.font = '600 32px "IBM Plex Mono", monospace'
    const cta = idleText?.cta ?? 'click the computer to play_'
    const blinkOn = Math.floor(now / 600) % 2 === 0
    ctx.fillText(blinkOn ? cta : cta.replace(/_$/, ' '), pad, 620)

    texture.needsUpdate = true
  }

  useFrame(({ clock }, delta) => {
    if (crt.current) {
      crt.current.uTime = clock.elapsedTime
      // no modo live o sangramento de fogo do shader acalma junto com o fogo
      crt.current.uHeat = THREE.MathUtils.damp(crt.current.uHeat, mode === 'live' ? 0.25 : 1, 2.5, delta)
    }
    if (mode === 'live') {
      // ~30fps: o upload da textura 1024×800 por frame é o gargalo
      const now = performance.now()
      if (now - lastLiveDraw.current > 33) {
        lastLiveDraw.current = now
        drawLive()
      }
    } else {
      const now = performance.now()
      if (now - lastIdleDraw.current > 100) {
        lastIdleDraw.current = now
        drawIdle(now)
      }
    }
  })

  return (
    <mesh>
      <planeGeometry args={[1.9, 1.48]} />
      <crtMaterial ref={crt} toneMapped={false} uHasMap={1.0} uMap={texture} />
    </mesh>
  )
}

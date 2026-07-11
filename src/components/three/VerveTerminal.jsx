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
    // zera o espelho na hora: o fogo da cena lê `typing` daqui
    if (statsRef) {
      statsRef.current = {
        wpm: 0,
        acc: 100,
        time: 0,
        best: stateRef.current.best,
        finished: false,
        typing: false,
      }
    }
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

  // paleta fiel ao TUI real do verve (terminal escuro, acento laranja)
  const UI = {
    bg: '#141013',
    border: '#413c3e',
    dim: '#6f6a66',
    upcoming: '#565250',
    current: '#8d8781',
    bright: '#ddd8cf',
    wrong: '#ff7a7a',
    accent: '#ff6b2b',
  }

  const drawDot = (x, y, r = 7) => {
    ctx.fillStyle = UI.accent
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

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
        typing: !!s.startTime,
      }
    }

    // background (scanlines vêm do crtMaterial)
    ctx.fillStyle = UI.bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const pad = 56
    ctx.textBaseline = 'top'

    // header: ● verve   5 / 25  (como o TUI real)
    drawDot(pad + 7, pad + 18)
    ctx.fillStyle = UI.bright
    ctx.font = '700 34px "IBM Plex Mono", monospace'
    ctx.fillText('verve', pad + 30, pad)
    ctx.fillStyle = UI.dim
    ctx.font = '500 28px "IBM Plex Mono", monospace'
    ctx.fillText(`${Math.min(s.wordIndex + 1, s.words.length)} / ${s.words.length}`, pad + 170, pad + 4)

    // caixa com borda onde vivem as palavras
    const boxX = pad
    const boxY = pad + 70
    const boxW = canvas.width - pad * 2
    const boxH = 440
    ctx.strokeStyle = UI.border
    ctx.lineWidth = 2
    ctx.strokeRect(boxX, boxY, boxW, boxH)

    // words area (dentro da caixa)
    const inPad = 34
    ctx.font = '500 32px "IBM Plex Mono", monospace'
    const lineH = 50
    const maxX = boxX + boxW - inPad
    let x = boxX + inPad
    let y = boxY + inPad

    const drawChar = (ch, color, underline) => {
      const w = ctx.measureText(ch).width
      ctx.fillStyle = color
      ctx.fillText(ch, x, y)
      if (underline) {
        ctx.fillStyle = UI.wrong
        ctx.fillRect(x, y + 38, w, 3)
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
      if (x + wordW > maxX && x > boxX + inPad) {
        x = boxX + inPad
        y += lineH
      }
      if (y > boxY + boxH - inPad - 40) break

      for (let c = 0; c < target.length; c++) {
        let color = UI.upcoming // not yet typed
        let underline = false
        if (c < typed.length) {
          if (typed[c] === target[c]) color = UI.bright
          else {
            color = UI.wrong
            underline = true
          }
        } else if (isCurrent) {
          color = UI.current
        }
        drawChar(target[c], color, underline)
      }
      // extra typed chars beyond target length (errors)
      if (typed.length > target.length) {
        for (let c = target.length; c < typed.length; c++) {
          drawChar(typed[c], UI.wrong, true)
        }
      }
      if (isCurrent && !s.finished) {
        // caret vertical, como no terminal
        const caretX = x
        if (Math.floor(now / 530) % 2 === 0) {
          ctx.fillStyle = UI.bright
          ctx.fillRect(caretX + 1, y - 2, 3, 40)
        }
      }
      x += gap
    }

    // rodapé: ● 84 wpm  ·  4s
    const footY = boxY + boxH + 40
    const t = s.startTime ? Math.round((now - s.startTime) / 1000) : 0
    drawDot(pad + 7, footY + 16)
    ctx.fillStyle = UI.bright
    ctx.font = '600 30px "IBM Plex Mono", monospace'
    const wpmStr = `${Math.round(stats.wpm)} wpm`
    ctx.fillText(wpmStr, pad + 30, footY)
    ctx.fillStyle = UI.dim
    const wpmW = ctx.measureText(wpmStr).width
    ctx.fillText(`  ·  ${t}s`, pad + 30 + wpmW, footY)

    if (s.finished) {
      ctx.fillStyle = UI.accent
      ctx.font = '600 26px "IBM Plex Mono", monospace'
      ctx.fillText('run complete · TAB restarts', pad + 300, footY + 2)
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
    ctx.fillStyle = UI.bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const pad = 64
    ctx.textBaseline = 'top'

    // header como o TUI real: ● verve
    drawDot(pad + 9, pad + 24, 9)
    ctx.fillStyle = UI.bright
    ctx.font = '700 46px "IBM Plex Mono", monospace'
    ctx.fillText('verve', pad + 38, pad)
    ctx.fillStyle = UI.dim
    ctx.font = '500 26px "IBM Plex Mono", monospace'
    ctx.fillText(idleText?.line1 ?? 'a typing test in your terminal', pad, pad + 76)

    // caixa com digitação fantasma em loop
    const boxY = pad + 140
    const boxH = 300
    ctx.strokeStyle = UI.border
    ctx.lineWidth = 2
    ctx.strokeRect(pad, boxY, canvas.width - pad * 2, boxH)

    const CYCLE = 2400
    const word = IDLE_WORDS[Math.floor(now / CYCLE) % IDLE_WORDS.length]
    const prog = (now % CYCLE) / CYCLE
    const shown = word.slice(0, Math.floor(Math.min(1, prog * 1.6) * word.length))
    ctx.font = '500 40px "IBM Plex Mono", monospace'
    ctx.fillStyle = UI.bright
    ctx.fillText(shown, pad + 40, boxY + 44)
    ctx.fillStyle = UI.upcoming
    ctx.fillText(word.slice(shown.length), pad + 40 + ctx.measureText(shown).width, boxY + 44)
    if (Math.floor(now / 530) % 2 === 0) {
      const w = ctx.measureText(shown).width
      ctx.fillStyle = UI.bright
      ctx.fillRect(pad + 40 + w + 4, boxY + 42, 3, 46)
    }

    // convite
    ctx.fillStyle = UI.accent
    ctx.font = '600 30px "IBM Plex Mono", monospace'
    const cta = idleText?.cta ?? 'click the computer to play_'
    const blinkOn = Math.floor(now / 600) % 2 === 0
    ctx.fillText(blinkOn ? cta : cta.replace(/_$/, ' '), pad, boxY + boxH + 48)

    texture.needsUpdate = true
  }

  useFrame(({ clock }, delta) => {
    if (crt.current) {
      crt.current.uTime = clock.elapsedTime
      // no close do verve o fogo apaga; o sangramento só volta (pequeno)
      // quando a digitação começa — acompanha o fogo da cena
      const heat = mode === 'live' ? (stateRef.current?.startTime ? 0.3 : 0) : 1
      crt.current.uHeat = THREE.MathUtils.damp(crt.current.uHeat, heat, 2.5, delta)
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

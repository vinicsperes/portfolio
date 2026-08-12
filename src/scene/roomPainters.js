/**
 * Pintores procedurais do quarto: Canvas2D puro, ZERO dependência de THREE ou
 * do DOM além do contexto 2d que recebem. Vivem separados de Room.jsx porque
 * rodam dentro de um Worker (roomTextures.worker.js) sobre um OffscreenCanvas —
 * assar essas quatro texturas na main thread custava ~1s de bloqueio no load,
 * bem no meio do loader. O caminho de fallback (sem Worker/OffscreenCanvas)
 * chama exatamente estas mesmas funções num canvas normal.
 */

const WOOD = '#5c3a24'

/**
 * Tamanho lógico de cada textura: é nesse sistema de coordenadas que todos os
 * pintores desenham. O tamanho REAL do canvas sai de textureSize(), que aplica
 * um fator de escala — em mobile as quatro juntas passavam de 20MB de VRAM.
 */
export const TEXTURE_SPECS = {
  floor: { w: 1024, h: 1024 },
  rug: { w: 1536, h: 1024 },
  wall: { w: 1024, h: 1024 },
  window: { w: 1024, h: 512 },
}

export function textureSize(name, scale = 1) {
  const { w, h } = TEXTURE_SPECS[name]
  return { w: Math.round(w * scale), h: Math.round(h * scale) }
}

function paintFloor(ctx) {
  const { w: W, h: H } = TEXTURE_SPECS.floor

  // Base
  ctx.fillStyle = WOOD
  ctx.fillRect(0, 0, W, H)

  const plankH = 128
  for (let y = 0; y < H; y += plankH) {
    // Plank gap
    ctx.fillStyle = '#2a1608'
    ctx.fillRect(0, y, W, 2)

    // Staggered vertical joints
    const off = (y / plankH) % 2 === 0 ? 0 : 300
    for (let x = off; x < W; x += 512) {
      ctx.fillRect(x, y, 2, plankH)
    }

    // Wood grain
    ctx.strokeStyle = 'rgba(90,55,30,0.25)'
    ctx.lineWidth = 1
    for (let i = 0; i < 10; i++) {
      const gy = y + 8 + i * (plankH / 10)
      ctx.beginPath()
      ctx.moveTo(0, gy)
      for (let gx = 0; gx < W; gx += 15) {
        ctx.lineTo(gx, gy + Math.sin(gx * 0.015 + i * 0.8 + y * 0.01) * 2.5)
      }
      ctx.stroke()
    }

    // Subtle per-plank color variation
    const r = 60 + ((y * 7 + 13) % 40)
    const g = 30 + ((y * 3 + 7) % 20)
    const b = 10 + ((y * 11 + 3) % 10)
    ctx.fillStyle = `rgba(${r},${g},${b},0.06)`
    ctx.fillRect(0, y + 2, W, plankH - 2)
  }

  // Knots
  for (let i = 0; i < 6; i++) {
    const kx = (i * 317 + 53) % W
    const ky = (i * 211 + 97) % H
    const kr = 8 + (i % 3) * 5
    const grad = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr)
    grad.addColorStop(0, 'rgba(30,15,5,0.5)')
    grad.addColorStop(0.6, 'rgba(50,30,15,0.2)')
    grad.addColorStop(1, 'rgba(70,40,20,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(kx, ky, kr, 0, Math.PI * 2)
    ctx.fill()
  }
}

/**
 * Tapete persa (paisagem): campo em vermelho-tijolo apagado, bordas finas,
 * treliça sutil de losangos, medalhão central em CONTORNO, cantos arredondados
 * via clip + alpha, e leve vinheta de tecido.
 */
function paintRug(ctx) {
  const { w: W, h: H } = TEXTURE_SPECS.rug

  const BRICK = '#5e2620'
  const BRICK_DARK = '#4a1d19'
  const CHARCOAL = '#22262e'
  const SAND = '#c8b088'
  const GOLD = '#a8874a'

  // clip com cantos arredondados — fora fica transparente
  const R = 42
  ctx.beginPath()
  ctx.roundRect(0, 0, W, H, R)
  ctx.clip()

  // campo
  ctx.fillStyle = BRICK
  ctx.fillRect(0, 0, W, H)

  // ruído de fibra (linhas horizontais muito sutis)
  for (let y = 0; y < H; y += 3) {
    const a = 0.03 + 0.03 * Math.abs(Math.sin(y * 0.7))
    ctx.fillStyle = `rgba(0,0,0,${a})`
    ctx.fillRect(0, y, W, 1)
  }

  // bordas: banda externa charcoal, filete sand, banda interna escura
  const band = (o, w, c) => {
    ctx.fillStyle = c
    ctx.fillRect(o, o, W - o * 2, w)
    ctx.fillRect(o, H - o - w, W - o * 2, w)
    ctx.fillRect(o, o, w, H - o * 2)
    ctx.fillRect(W - o - w, o, w, H - o * 2)
  }
  band(26, 34, CHARCOAL)
  band(70, 4, SAND)
  band(84, 22, BRICK_DARK)
  band(116, 3, GOLD)

  // treliça de losangos no campo (bem discreta)
  const step = 96
  ctx.strokeStyle = 'rgba(200,176,136,0.10)'
  ctx.lineWidth = 2
  for (let y = 150; y < H - 150; y += step) {
    for (let x = 150; x < W - 150; x += step) {
      ctx.beginPath()
      ctx.moveTo(x, y - step / 2)
      ctx.lineTo(x + step / 2, y)
      ctx.lineTo(x, y + step / 2)
      ctx.lineTo(x - step / 2, y)
      ctx.closePath()
      ctx.stroke()
    }
  }

  // medalhão central: losangos concêntricos em contorno
  const cx = W / 2
  const cy = H / 2
  const diamond = (rw, rh, color, lw) => {
    ctx.strokeStyle = color
    ctx.lineWidth = lw
    ctx.beginPath()
    ctx.moveTo(cx, cy - rh)
    ctx.lineTo(cx + rw, cy)
    ctx.lineTo(cx, cy + rh)
    ctx.lineTo(cx - rw, cy)
    ctx.closePath()
    ctx.stroke()
  }
  diamond(320, 210, SAND, 5)
  diamond(260, 170, GOLD, 3)
  diamond(185, 120, 'rgba(200,176,136,0.55)', 2)
  // núcleo pequeno preenchido
  ctx.fillStyle = CHARCOAL
  ctx.beginPath()
  ctx.moveTo(cx, cy - 38)
  ctx.lineTo(cx + 56, cy)
  ctx.lineTo(cx, cy + 38)
  ctx.lineTo(cx - 56, cy)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 2
  ctx.stroke()

  // quartos de medalhão ecoando nos cantos do campo
  const corner = (x, y, sx, sy) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(sx, sy)
    ctx.strokeStyle = 'rgba(200,176,136,0.4)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, 190)
    ctx.lineTo(130, 0)
    ctx.moveTo(0, 130)
    ctx.lineTo(90, 0)
    ctx.stroke()
    ctx.restore()
  }
  corner(140, 140, 1, 1)
  corner(W - 140, 140, -1, 1)
  corner(140, H - 140, 1, -1)
  corner(W - 140, H - 140, -1, -1)

  // vinheta de tecido
  const vig = ctx.createRadialGradient(cx, cy, H * 0.25, cx, cy, H * 0.75)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.22)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, W, H)
}

/**
 * Deslocamentos para uma forma de raio `r` centrada em `c` dar a volta no tile
 * de lado `S`: quem encosta numa borda é redesenhado do lado oposto. É o que
 * torna o padrão contínuo quando a textura repete.
 */
function wrapOffsets(c, r, S) {
  const out = [0]
  if (c - r < 0) out.push(S)
  if (c + r > S) out.push(-S)
  return out
}

/**
 * Parede: reboco pintado com grão, manchas amplas e sujeirinha nos cantos.
 * Sem isso ela lia como fundo preto chapado ao lado do chão texturizado.
 *
 * TUDO aqui é desenhado com wrap. A parede tem 60 unidades de largura com
 * repeat(5,2), então o tile aparece dez vezes, e o dono via as emendas: as
 * manchas eram cortadas na borda e a descontinuidade virava uma linha vertical
 * na parede, denunciando onde a textura reseta.
 */
function paintWall(ctx) {
  const { w: S } = TEXTURE_SPECS.wall

  // cor FINAL assada na textura (material fica branco: map já escurecido
  // multiplicado por outra cor foi o que deixou a parede preta)
  ctx.fillStyle = '#39343f'
  ctx.fillRect(0, 0, S, S)

  // manchas largas de tinta/gesso: quebram o chapado em áreas grandes
  for (let i = 0; i < 30; i++) {
    const x = (i * 271 + 61) % S
    const y = (i * 397 + 137) % S
    const r = 110 + ((i * 53) % 170)
    const light = i % 3 !== 0
    for (const dx of wrapOffsets(x, r, S)) {
      for (const dy of wrapOffsets(y, r, S)) {
        const cx = x + dx
        const cy = y + dy
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        g.addColorStop(0, light ? 'rgba(120,108,126,0.15)' : 'rgba(24,22,32,0.2)')
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // grão fino do reboco. getImageData/putImageData ignoram a transformação do
  // contexto, então aqui vale o tamanho REAL do canvas, não o lógico — é o que
  // faz o custo desse loop cair junto quando a textura é reduzida
  const img = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 16
    d[i] += n
    d[i + 1] += n
    d[i + 2] += n * 1.1
  }
  ctx.putImageData(img, 0, 0)

  // riscos verticais discretos (marca de rolo de pintura). Vão de topo a base,
  // então já emendam na vertical; o que sobra da borda direita volta na
  // esquerda pra não virar um risco pela metade
  ctx.globalAlpha = 0.05
  for (let i = 0; i < 40; i++) {
    const x = (i * 149 + 23) % S
    const w = 1 + (i % 3)
    ctx.fillStyle = i % 2 ? '#5a5266' : '#1a1822'
    ctx.fillRect(x, 0, w, S)
    if (x + w > S) ctx.fillRect(x - S, 0, w, S)
  }
  ctx.globalAlpha = 1
}

// skyline compartilhado entre as vistas (mesma cidade, hora diferente)
const SKY_BUILDINGS = [
  [0, 90], [55, 130], [125, 70], [195, 150], [270, 100], [335, 170],
  [410, 90], [480, 140], [555, 110], [625, 165], [700, 95], [770, 135],
  [845, 75], [910, 120], [975, 85],
]

/** Vista noturna pela janela: céu fundo azul, lua alta, estrelas e skyline. */
function drawNightView(ctx, W, H) {
  // céu noturno (quase preto no topo → azul profundo no horizonte)
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#070b1d')
  sky.addColorStop(0.5, '#101a38')
  sky.addColorStop(0.85, '#1b2a50')
  sky.addColorStop(1, '#28395e')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  // estrelas (determinísticas: nada de Math.random pra não piscar entre mounts)
  for (let i = 0; i < 110; i++) {
    const x = ((i * 137.51) % 1) * W + ((i * 61) % 17)
    const y = ((i * 89.37) % 1) * 0.72 * H
    const big = i % 19 === 0
    ctx.fillStyle = `rgba(214, 226, 255, ${big ? 0.85 : 0.25 + ((i * 37) % 45) / 100})`
    ctx.fillRect(x % W, y, big ? 2.5 : 1.5, big ? 2.5 : 1.5)
  }

  // lua alta à direita: glow difuso + disco + crateras discretas
  const mx = W * 0.7
  const my = H * 0.26
  const glow = ctx.createRadialGradient(mx, my, 8, mx, my, 190)
  glow.addColorStop(0, 'rgba(215, 228, 255, 0.55)')
  glow.addColorStop(0.35, 'rgba(190, 208, 250, 0.18)')
  glow.addColorStop(1, 'rgba(180, 200, 250, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#e9effc'
  ctx.beginPath()
  ctx.arc(mx, my, 38, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(196, 208, 235, 0.55)'
  ;[[-12, -6, 7], [10, 4, 5], [-2, 14, 4], [14, -14, 3.5]].forEach(([dx, dy, r]) => {
    ctx.beginPath()
    ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2)
    ctx.fill()
  })

  // skyline em silhueta azul-noite
  ctx.fillStyle = '#0b1122'
  SKY_BUILDINGS.forEach(([x, h], i) => {
    const w = 42 + (i % 3) * 14
    ctx.fillRect(x, H - h, w, h)
  })
  // janelinhas acesas (maioria quente, umas poucas frias de TV ligada)
  for (let i = 0; i < 26; i++) {
    const b = SKY_BUILDINGS[i % SKY_BUILDINGS.length]
    const x = b[0] + 6 + ((i * 13) % 34)
    const y = H - ((i * 29) % (b[1] - 14)) - 8
    ctx.fillStyle = i % 5 === 0 ? 'rgba(150, 185, 255, 0.4)' : 'rgba(255, 200, 110, 0.45)'
    ctx.fillRect(x, y, 3, 4)
  }

  // brilho urbano rente ao horizonte (sódio, bem sutil)
  const haze = ctx.createLinearGradient(0, H * 0.78, 0, H)
  haze.addColorStop(0, 'rgba(235, 160, 90, 0)')
  haze.addColorStop(1, 'rgba(235, 160, 90, 0.16)')
  ctx.fillStyle = haze
  ctx.fillRect(0, H * 0.78, W, H * 0.22)
}

/** Vista golden hour: céu quente, sol baixo e skyline em silhueta. */
function drawSunsetView(ctx, W, H) {
  // céu golden hour (violeta no topo → laranja/amarelo no horizonte)
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#39335f')
  sky.addColorStop(0.42, '#b85d78')
  sky.addColorStop(0.72, '#ef9257')
  sky.addColorStop(1, '#ffcb7d')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  // brilho difuso do sol baixo
  const sx = W * 0.72
  const sy = H * 0.6
  const glow = ctx.createRadialGradient(sx, sy, 10, sx, sy, 260)
  glow.addColorStop(0, 'rgba(255,240,200,0.9)')
  glow.addColorStop(0.3, 'rgba(255,214,150,0.45)')
  glow.addColorStop(1, 'rgba(255,205,140,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  // disco do sol
  ctx.fillStyle = '#fff2d2'
  ctx.beginPath()
  ctx.arc(sx, sy, 44, 0, Math.PI * 2)
  ctx.fill()

  // skyline em silhueta quente
  ctx.fillStyle = '#5a3344'
  SKY_BUILDINGS.forEach(([x, h], i) => {
    const w = 42 + (i % 3) * 14
    ctx.fillRect(x, H - h, w, h)
  })
  // janelinhas acesas quentes
  ctx.fillStyle = 'rgba(255,190,90,0.6)'
  for (let i = 0; i < 26; i++) {
    const b = SKY_BUILDINGS[i % SKY_BUILDINGS.length]
    const x = b[0] + 6 + ((i * 13) % 34)
    const y = H - ((i * 29) % (b[1] - 14)) - 8
    ctx.fillRect(x, y, 3, 4)
  }

  // haze quente na base do horizonte
  const haze = ctx.createLinearGradient(0, H * 0.72, 0, H)
  haze.addColorStop(0, 'rgba(255,190,120,0)')
  haze.addColorStop(1, 'rgba(255,178,110,0.32)')
  ctx.fillStyle = haze
  ctx.fillRect(0, H * 0.72, W, H * 0.28)
}

/**
 * Pinta a textura `name` no contexto 2d dado. `sky` só interessa à vista da
 * janela ('night' = céu noturno com lua; qualquer outro = golden hour).
 *
 * `scale` reduz a textura sem tocar em nenhum pintor: eles continuam
 * desenhando no sistema de coordenadas de TEXTURE_SPECS e o contexto encolhe o
 * resultado. Ver textureSize().
 */
export function paintTexture(name, ctx, sky, scale = 1) {
  const { w, h } = TEXTURE_SPECS[name]
  if (scale !== 1) ctx.scale(scale, scale)
  if (name === 'floor') return paintFloor(ctx)
  if (name === 'rug') return paintRug(ctx)
  if (name === 'wall') return paintWall(ctx)
  if (name === 'window') {
    return sky === 'night' ? drawNightView(ctx, w, h) : drawSunsetView(ctx, w, h)
  }
  throw new Error(`textura desconhecida: ${name}`)
}

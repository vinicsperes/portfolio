/**
 * Assa os assets estáticos que antes eram gerados no navegador do visitante:
 *
 *   public/img/knobs-still.webp        still dos knobs (usado no lugar do 3º
 *                                      contexto WebGL em mobile)
 *   public/img/presets/*.webp          os 6 frames de shader dos cards de preset
 *   public/img/presets/ghost-blur.webp o fundo borrado da seção Ghost
 *
 * Rodar só quando os shaders/knobs mudarem — o resultado é commitado:
 *
 *   node scripts/bake.mjs
 *
 * Precisa de google-chrome no PATH (é ele quem renderiza E codifica os webp).
 * Sobe o vite dev sozinho.
 */
import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 5199
const BASE = `http://localhost:${PORT}/scripts/bake.html`
const PRESETS = ['haunted', 'occult', 'glacier', 'hollow', 'ether', 'delirium']

const CHROME = [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu-sandbox',
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--hide-scrollbars',
  '--default-background-color=00000000',
  '--virtual-time-budget=30000',
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      /* ainda subindo */
    }
    await sleep(300)
  }
  throw new Error(`vite não respondeu em ${url}`)
}

/** Roda a página e devolve o JSON que ela publicou no <pre id="out">. */
function harvest(what) {
  const dump = execFileSync('google-chrome', [...CHROME, '--dump-dom', `${BASE}?what=${what}`], {
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  const m = dump.match(/<pre id="out">([\s\S]*?)<\/pre>/)
  if (!m) throw new Error(`${what}: a página não publicou nada — o WebGL do headless falhou?`)
  // base64 não tem &, < nem >, então só o JSON em volta precisa de unescape
  return JSON.parse(m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'))
}

function write(dataUrl, outPath) {
  writeFileSync(outPath, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'))
  console.log('  ', outPath.replace(ROOT + '/', ''))
}

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  cwd: ROOT,
  // stdio ignorado de propósito: com 'inherit' o vite segura o pipe de stderr
  // do script aberto e a saída do bake nunca chega ao terminal
  stdio: 'ignore',
})

try {
  mkdirSync(join(ROOT, 'public/img/presets'), { recursive: true })
  await waitForServer(BASE)

  console.log('assando o still dos knobs…')
  write(harvest('knobs').still, join(ROOT, 'public/img/knobs-still.webp'))

  console.log('assando os thumbs dos presets…')
  const thumbs = harvest('thumbs')
  thumbs.presets.forEach((url, i) => write(url, join(ROOT, 'public/img/presets', `${PRESETS[i]}.webp`)))
  write(thumbs.blur, join(ROOT, 'public/img/presets/ghost-blur.webp'))

  console.log('pronto.')
} finally {
  server.kill('SIGTERM')
}

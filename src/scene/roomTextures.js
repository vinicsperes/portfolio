import * as THREE from 'three'
import { TEXTURE_SPECS, paintTexture } from './roomPainters.js'

/**
 * Texturas procedurais do quarto, assadas UMA vez e fora da main thread.
 *
 * Antes eram quatro `useMemo` pintando canvas 1024²/1536² direto na main
 * thread durante o mount do Room, ou seja, no meio do loader: ~1s de bloqueio
 * (a parede sozinha, com o loop de grão por pixel, dava ~150ms). Agora um
 * Worker pinta em OffscreenCanvas e devolve ImageBitmaps, em paralelo com a
 * compilação de shaders. O hook suspende, então o CompileGate (e portanto o
 * BootLoader) continua esperando a cena ficar pronta de verdade.
 *
 * Sem Worker/OffscreenCanvas (Safari antigo, worker que falha ao carregar) cai
 * no caminho síncrono de sempre: mais lento, mas idêntico na tela.
 */

const NAMES = ['floor', 'rug', 'wall', 'window']

// o que cada textura precisa além do default (o resto vem do construtor)
const TWEAKS = {
  floor: (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(4, 4)
  },
  wall: (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(5, 2)
  },
}

// se o worker engasgar, não dá pra deixar o loader preso pra sempre
const WORKER_TIMEOUT_MS = 4000

function paintHere(sky) {
  const out = {}
  for (const name of NAMES) {
    const { w, h } = TEXTURE_SPECS[name]
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    paintTexture(name, canvas.getContext('2d'), sky)
    const tex = new THREE.CanvasTexture(canvas)
    TWEAKS[name]?.(tex)
    out[name] = tex
  }
  return out
}

function paintInWorker(sky) {
  return new Promise((resolve, reject) => {
    let worker
    try {
      worker = new Worker(new URL('./roomTextures.worker.js', import.meta.url), { type: 'module' })
    } catch (err) {
      return reject(err)
    }
    const done = (fn, arg) => {
      clearTimeout(timer)
      worker.terminate()
      fn(arg)
    }
    const timer = setTimeout(() => done(reject, new Error('timeout do worker de texturas')), WORKER_TIMEOUT_MS)
    worker.onerror = (e) => done(reject, e)
    worker.onmessage = (e) => {
      if (e.data.error) return done(reject, new Error(e.data.error))
      const out = {}
      for (const [name, bitmap] of Object.entries(e.data.bitmaps)) {
        // o bitmap já vem flipado do worker: a three ignora texture.flipY
        // quando a fonte é ImageBitmap
        const tex = new THREE.Texture(bitmap)
        tex.needsUpdate = true
        TWEAKS[name]?.(tex)
        out[name] = tex
      }
      done(resolve, out)
    }
    worker.postMessage({ names: NAMES, sky })
  })
}

async function bake(sky) {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return paintHere(sky)
  try {
    return await paintInWorker(sky)
  } catch {
    return paintHere(sky)
  }
}

// cache por `sky`: o Room pode remontar (troca de view), assar de novo não
const cache = new Map()

/** Suspende até as texturas estarem prontas. Só pode ser usado sob <Suspense>. */
export function useRoomTextures(sky) {
  let entry = cache.get(sky)
  if (!entry) {
    entry = { status: 'pending' }
    entry.promise = bake(sky).then((value) => {
      entry.status = 'done'
      entry.value = value
    })
    cache.set(sky, entry)
  }
  if (entry.status === 'pending') throw entry.promise
  return entry.value
}

/**
 * Entrada da página de assar assets (scripts/bake.html). NÃO faz parte do
 * bundle do site: o vite build só entra pelo index.html da raiz.
 *
 * ?what=knobs   monta o canvas dos knobs em fundo transparente e devolve o
 *               still (vira a imagem que substitui o 3º contexto WebGL em mobile)
 * ?what=thumbs  roda os shaders de preset e devolve os 6 frames + o fundo borrado
 *
 * Nos dois casos o resultado sai como JSON de data URLs webp num <pre id="out">,
 * que o scripts/bake.mjs lê com `chrome --dump-dom`. Quem codifica o webp é o
 * próprio chrome: o encoder do ffmpeg cospe arquivo que nem o ffprobe relê.
 */
import { createRoot } from 'react-dom/client'
import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Preload } from '@react-three/drei'
import { Knob3D } from '../src/components/three/pedal/knobs'
import { renderPresetThumbs, getBlurredGhostThumb } from '../src/components/three/pedal/presetShaders.js'
import { HDRI } from '../src/scene/env.js'

const LED = '#20f040'
const KNOBS = [
  { label: 'DRIVE', x: -0.55 },
  { label: 'ECHO', x: 0 },
  { label: 'REVERB', x: 0.55 },
]
const KNOB_VALS = [0.72, 0.45, 0.85]
const noop = () => {}

// mesma proporção do card em celular (390x176 css), assado em 2x
const OUT_W = 780
const OUT_H = 352

/** Redesenha uma imagem/canvas no tamanho pedido e devolve webp. */
function toWebp(source, w, h, quality = 0.9) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  c.getContext('2d').drawImage(source, 0, 0, w, h)
  return c.toDataURL('image/webp', quality)
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function publish(payload) {
  const pre = document.createElement('pre')
  pre.id = 'out'
  pre.textContent = JSON.stringify(payload)
  document.body.appendChild(pre)
  document.title = 'DONE'
}

/**
 * Cópia fiel do KnobsCanvas de GhostCards, com duas diferenças: sem <Float>
 * (o still tem que pegar os knobs em repouso, não no meio da flutuação) e
 * preserveDrawingBuffer, pra dar pra ler o canvas depois do frame.
 */
function KnobsStill() {
  return (
    <Canvas
      camera={{ position: [0, 1.05, 1.5], fov: 30, near: 0.1, far: 20 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      // 2x e reduzido na hora de exportar: supersampling de graça
      dpr={2}
      onCreated={({ camera }) => camera.lookAt(0, 0.1, 0)}
    >
      <ambientLight intensity={0.5} color="#f0e8d8" />
      <directionalLight position={[-3, 4, 2]} intensity={2} color="#e8dfc8" />
      <directionalLight position={[3, 3, -2]} intensity={1.2} color="#c8d8f0" />
      <Suspense fallback={null}>
        <Environment files={HDRI} environmentIntensity={0.6} />
        {/* sem bootTrigger: a animação de boot depende de timers e de frames
            reais, e sob --virtual-time-budget ela às vezes não chega a rodar —
            o still saía com os três knobs no zero. Aqui o ângulo final é
            aplicado direto num group por fora (mesma conta do Knob3D:
            3/4·π − valor·3/2·π, com o interno já em 3/4·π), então o resultado
            é determinístico. O corpo do knob é cilíndrico: girar o group
            inteiro é indistinguível de girar só o miolo. */}
        {KNOBS.map((k, i) => (
          <group key={k.label} position={[k.x, 0, 0]} rotation-y={-KNOB_VALS[i] * 1.5 * Math.PI}>
            <Knob3D
              value={KNOB_VALS[i]}
              onChange={noop}
              ink="#e0e0ec"
              accent={LED}
              label={k.label}
              setControlsEnabled={noop}
              bootTrigger={0}
              delay={0}
              interactive={false}
            />
          </group>
        ))}
        <ContactShadows
          position={[0, -0.001, 0]}
          opacity={0.5}
          scale={4}
          blur={2.4}
          far={0.8}
          resolution={512}
          frames={1}
        />
        <Preload all />
      </Suspense>
    </Canvas>
  )
}

const what = new URLSearchParams(location.search).get('what')

if (what === 'thumbs') {
  // 320x180 em vez dos 420x240 do runtime: os shaders têm muita borda dura, que
  // é o que engorda webp com perda — e o card nunca passa de ~350px de largura
  const pngs = renderPresetThumbs(320, 180)
  Promise.all([...pngs.map(loadImage), getBlurredGhostThumb().then(loadImage)]).then((imgs) => {
    const blur = imgs.pop()
    publish({
      // qualidade baixa de propósito: são fundos abstratos, entram a 65-88% de
      // opacidade e ainda levam um gradiente escuro por cima
      presets: imgs.map((img) => toWebp(img, img.width, img.height, 0.7)),
      blur: toWebp(blur, blur.width, blur.height, 0.8),
    })
  })
} else {
  const stage = document.getElementById('stage')
  stage.style.width = `${OUT_W}px`
  stage.style.height = `${OUT_H}px`
  createRoot(stage).render(<KnobsStill />)
  // tempo pro HDRI resolver, o boot dos knobs assentar e a ContactShadows
  // gastar seu frame único
  setTimeout(() => {
    const canvas = document.querySelector('canvas')
    publish({ still: toWebp(canvas, OUT_W, OUT_H, 0.92) })
  }, 6000)
}

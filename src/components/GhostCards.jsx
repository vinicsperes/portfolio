import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Preload } from '@react-three/drei'
import { Knob3D } from './three/pedal/knobs'
import { getPresetThumbs, PRESET_OPACITY } from './three/pedal/presetShaders.js'
import { useLang } from '../i18n/LanguageContext.jsx'
import { useReveal } from '../hooks/useReveal.js'
import { useNearViewport } from '../hooks/useNearViewport.js'

const GREEN = '#16a030'
const LED = '#20f040'

// colorways reais do produto (ghostfx/src/data/presets.ts → PRESET_META)
const PRESET_META = [
  { color: '#20f040', word: 'HAUNTED' },
  { color: '#7d22c4', word: 'OCCULT' },
  { color: '#a8c4dc', word: 'GLACIER' },
  { color: '#e02828', word: 'HOLLOW' },
  { color: '#d46a9f', word: 'ETHER' },
  { color: '#f02a96', word: 'DELIRIUM' },
]

const KNOBS = [
  { label: 'DRIVE', x: -0.55 },
  { label: 'ECHO', x: 0 },
  { label: 'REVERB', x: 0.55 },
]

const noop = () => {}

const revealCls = (visible) =>
  `transition-all duration-700 ease-out ${
    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
  }`

/** Frames estáticos dos shaders de preset do ghostfx, gerados uma única vez. */
function usePresetThumbs(enabled) {
  const [thumbs, setThumbs] = useState(null)
  useEffect(() => {
    if (!enabled || thumbs) return
    // adia para não competir com os canvases 3D na entrada da seção
    const id = setTimeout(() => {
      try {
        setThumbs(getPresetThumbs())
      } catch {
        /* sem WebGL: cards ficam só com a cor do preset */
      }
    }, 250)
    return () => clearTimeout(id)
  }, [enabled, thumbs])
  return thumbs
}

/**
 * Fundo da seção Ghost: o shader do preset GHOST (frame estático) bem
 * difuso, para diferenciar a seção sem competir com o pedal.
 */
export function GhostSectionBg() {
  const [ref, near] = useNearViewport('400px')
  const thumbs = usePresetThumbs(near)
  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {thumbs?.[0] && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${thumbs[0]})`,
            opacity: 0.14,
            filter: 'blur(16px)',
            transform: 'scale(1.15)',
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 60% at 70% 32%, rgba(22,160,48,0.06), rgba(10,10,15,0.82) 78%)',
        }}
      />
    </div>
  )
}

/** Três knobs do pedal, decorativos (a animação de boot ainda roda). */
function KnobsCanvas({ boot }) {
  const [vals, setVals] = useState([0.72, 0.45, 0.85])
  return (
    <Canvas
      camera={{ position: [0, 1.05, 1.5], fov: 30, near: 0.1, far: 20 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
      frameloop={boot ? 'always' : 'never'}
      onCreated={({ camera }) => camera.lookAt(0, 0.1, 0)}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[-3, 4, 2]} intensity={2.2} color="#e8dfc8" />
      <directionalLight position={[3, 3, -2]} intensity={1.2} color="#c8d8f0" />
      <Suspense fallback={null}>
        <Environment files="/hdri/potsdamer_platz_1k.hdr" environmentIntensity={0.6} />
        {KNOBS.map((k, i) => (
          <Knob3D
            key={k.label}
            position={[k.x, 0, 0]}
            value={vals[i]}
            onChange={(v) => setVals((a) => a.map((old, j) => (j === i ? v : old)))}
            ink="#e0e0ec"
            accent={LED}
            label={k.label}
            setControlsEnabled={noop}
            bootTrigger={boot ? 1 : 0}
            delay={i * 0.12}
          />
        ))}
        <ContactShadows position={[0, -0.001, 0]} opacity={0.5} scale={4} blur={2.4} far={0.8} resolution={256} />
        <Preload all />
      </Suspense>
    </Canvas>
  )
}

/**
 * Linha de cards da seção Ghost: knobs interativos (quadradinho) e os seis
 * presets com seus backgrounds reais ao lado — tudo na mesma tela do hero.
 */
export function GhostCards() {
  const { t } = useLang()
  const k = t.ghost.features.knobs
  const presets = t.ghost.presets
  // monta cedo (Preload compila com o frameloop parado); roda só quando visível
  const [knobsRef, knobsNear] = useNearViewport('900px')
  const [knobsRunRef, knobsRun] = useNearViewport('0px')
  const thumbs = usePresetThumbs(knobsNear)
  const [rRow, vRow] = useReveal(0.1)

  return (
    <div ref={rRow} className={`grid grid-cols-1 gap-3 lg:grid-cols-12 ${revealCls(vRow)}`}>
      {/* knobs de verdade, card quadrado */}
      <div
        ref={knobsRef}
        className="relative flex flex-col overflow-hidden border border-paper/10 lg:col-span-4"
        style={{
          background: 'linear-gradient(180deg, rgba(22,160,48,0.07) 0%, rgba(10,10,15,0) 55%)',
        }}
      >
        <div className="px-4 pt-4">
          <h4 className="font-poster uppercase text-lg text-paper">{k.title}</h4>
          <p className="mt-1 font-mono text-[10px] text-paper/60 leading-relaxed">{k.p}</p>
        </div>
        {/* pointer-events-none: os knobs aqui são vitrine, não controle */}
        <div ref={knobsRunRef} className="pointer-events-none relative h-44 flex-1">
          {knobsNear && <KnobsCanvas boot={knobsRun} />}
          {/* silkscreen em DOM: alinhado por terços com os knobs em x = -0.55/0/0.55 */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-2 grid grid-cols-3 text-center font-mono text-[8px] font-bold tracking-[0.3em]"
            style={{ color: GREEN }}
            aria-hidden="true"
          >
            {KNOBS.map((kn) => (
              <span key={kn.label}>{kn.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* seis presets = seis colorways, com os shaders reais do app de fundo */}
      <div className="flex flex-col lg:col-span-8">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h4 className="font-poster uppercase text-lg text-paper">{presets.title}</h4>
          <p className="font-mono text-[10px] text-paper/60 leading-relaxed">{presets.short}</p>
        </div>
        <div className="mt-3 grid grid-cols-1 flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {presets.list.map((p, i) => (
            <div
              key={p.name}
              className="preset-cell relative overflow-hidden border p-3"
              style={{ '--pc': PRESET_META[i].color, '--po': PRESET_OPACITY[i] }}
            >
              {thumbs?.[i] && (
                <div
                  className="preset-bg absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${thumbs[i]})` }}
                  aria-hidden="true"
                />
              )}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: 'linear-gradient(180deg, rgba(10,10,15,0.1), rgba(10,10,15,0.65))',
                }}
                aria-hidden="true"
              />
              <div className="relative z-10">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-poster text-lg uppercase" style={{ color: PRESET_META[i].color }}>
                    {p.name}
                  </span>
                  <span className="font-mono text-[8px] tracking-[0.25em] text-paper/40">
                    {PRESET_META[i].word}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-[10px] text-paper/65 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

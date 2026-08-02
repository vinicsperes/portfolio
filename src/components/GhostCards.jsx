import { useNearViewport } from '../hooks/useNearViewport.js'
import { PRESET_OPACITY } from './three/pedal/presetShaders.js'
import { useLang } from '../i18n/LanguageContext.jsx'

const GREEN = '#16a030'

// colorways reais do produto (ghostfx/src/data/presets.ts → PRESET_META)
const PRESET_META = [
  { color: '#20f040', word: 'HAUNTED' },
  { color: '#7d22c4', word: 'OCCULT' },
  { color: '#a8c4dc', word: 'GLACIER' },
  { color: '#e02828', word: 'HOLLOW' },
  { color: '#d46a9f', word: 'ETHER' },
  { color: '#f02a96', word: 'DELIRIUM' },
]

// x = centro de cada knob DENTRO do still (% da largura da imagem, medido nos
// pixels de knobs-still.webp). Não são terços: o render tem margem lateral.
const KNOBS = [
  { label: 'DRIVE', x: 24.6 },
  { label: 'ECHO', x: 49.9 },
  { label: 'REVERB', x: 75.3 },
]

// proporção do still; a caixa dos rótulos usa a mesma para acompanhar a imagem
const STILL_W = 780
const STILL_H = 352

/**
 * Frames dos shaders de preset do ghostfx, ASSADOS EM BUILD (scripts/bake.mjs).
 *
 * Antes eram gerados no navegador do visitante: um contexto WebGL extra só pra
 * isso, 6 shaders compilados e 6 `canvas.toDataURL('image/png')` SÍNCRONOS na
 * main thread — ~600KB de base64 que ainda voltavam a ser decodificados como
 * imagem. Tudo isso caía no primeiro scroll, junto com os canvases da seção.
 */
const PRESET_THUMBS = [
  '/img/presets/haunted.webp',
  '/img/presets/occult.webp',
  '/img/presets/glacier.webp',
  '/img/presets/hollow.webp',
  '/img/presets/ether.webp',
  '/img/presets/delirium.webp',
]
const GHOST_BLUR = '/img/presets/ghost-blur.webp'

/**
 * Fundo da seção Ghost: o shader do preset GHOST (frame estático) bem
 * difuso, para diferenciar a seção sem competir com o pedal.
 */
export function GhostSectionBg() {
  const [ref, near] = useNearViewport('400px')
  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {near && (
        // o blur vem PRÉ-APLICADO na imagem: `filter: blur()` aqui era um
        // passe de composição por frame numa div de tela cheia, brigando
        // com os dois canvases da seção
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${GHOST_BLUR})`, opacity: 0.14, transform: 'scale(1.06)' }}
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

/**
 * Linha de cards da seção Ghost: knobs interativos (quadradinho) e os seis
 * presets com seus backgrounds reais ao lado — tudo na mesma tela do hero.
 */
export function GhostCards() {
  const { t } = useLang()
  const k = t.ghost.features.knobs
  const presets = t.ghost.presets
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      {/* knobs de verdade, card quadrado */}
      <div
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
        <div className="pointer-events-none flex h-44 flex-1 items-center">
          {/* caixa com a proporção do still: assim os rótulos se ancoram na
              IMAGEM, não no card. Com `object-contain` num card mais largo que
              390px a imagem ficava centralizada com sobra dos lados e a
              serigrafia (que media terços do card) escorregava dos knobs.
              max-w-390 = a mesma largura que o contain dava a 176px de altura */}
          <div
            className="relative mx-auto w-full max-w-[390px]"
            style={{ aspectRatio: `${STILL_W} / ${STILL_H}` }}
          >
            {/*
              Still assado (scripts/bake.mjs), não canvas. Estes três knobs eram
              um contexto WebGL inteiro, com HDRI e frameloop 'always' enquanto o
              card estivesse na tela, por uma flutuação em peças que nem são
              clicáveis (interactive={false}, container com pointer-events-none).
              Virar imagem tira um contexto WebGL do desktop e acaba com o
              caminho duplo que existia só no celular.
            */}
            <img
              src="/img/knobs-still.webp"
              alt=""
              width={STILL_W}
              height={STILL_H}
              loading="lazy"
              decoding="async"
              aria-hidden="true"
              className="h-full w-full"
            />
            {/* silkscreen em DOM: cada rótulo centrado no eixo do seu knob; o
                +0.15em compensa o tracking, que joga um espaço sobrando à
                direita da última letra e desloca os glifos pra esquerda */}
            <div
              className="pointer-events-none absolute inset-x-0 top-[79%] font-mono text-[8px] font-bold tracking-[0.3em]"
              style={{ color: GREEN }}
              aria-hidden="true"
            >
              {KNOBS.map((kn) => (
                <span
                  key={kn.label}
                  className="absolute whitespace-nowrap"
                  style={{ left: `${kn.x}%`, transform: 'translateX(calc(-50% + 0.15em))' }}
                >
                  {kn.label}
                </span>
              ))}
            </div>
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
              <div
                className="preset-bg absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${PRESET_THUMBS[i]})` }}
                aria-hidden="true"
              />
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
                  <span className="font-mono text-[8px] tracking-[0.25em] text-paper/55">
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

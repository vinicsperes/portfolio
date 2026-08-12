import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { RetroPC } from './RetroPC.jsx'
import { Room } from './Room.jsx'
import { GuitarAmp } from './GuitarAmp.jsx'
import { VinylCrate } from './VinylCrate.jsx'
import { VIEWS } from '../../scene/hotspots.js'
import { getLightPreset } from '../../scene/lighting.js'
import { warmScene } from '../../scene/warmup.js'

// resolvido uma vez no load: trocar de preset (?light=) implica reload mesmo
const L = getLightPreset()

// Sobrou UMA point light na cena: a do fogo do CRT, que pisca e faz trabalho
// visual. Canto, velas e luz de leitura da estante saíram (2026-08-03).
//
// HONESTIDADE SOBRE O MOTIVO: point light custa por pixel na cena inteira, e o
// quarto é geometria de tela cheia — foi o que motivou os cortes anteriores. Só
// que o A/B entre builds, com ordem controlada, NÃO mostrou ganho ao tirar
// estas três (~13ms de GPU por frame nos dois). Quem disse que havia ganho foi
// uma ablação em runtime que depois se mostrou não confiável. Então o corte
// vale pela cena mais simples e pelas velas que o dono quis fora, não por perf
// comprovada. Se for medir de novo: A/B entre builds, alternando a ordem — a
// GPU desta máquina esquenta e penaliza sempre quem roda por último.
//
// O ambiente sobe pra repor o piso de luminosidade que elas davam: era o que o
// mobile já fazia (que não tinha canto nem velas), agora vale pra todo mundo.
const AMBIENT_INTENSITY = L.ambient.intensity * 1.14

// escratches reutilizados — nada de alocar por frame
const _pos = new THREE.Vector3()
const _look = new THREE.Vector3()
const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()

function CameraController({ view }) {
  const snapped = useRef(false)
  const portrait = useRef(false)

  useFrame((state, rawDelta) => {
    // o frameloop pausa atrás do loader e fora da viewport: o frame seguinte
    // chega com delta de segundos — sem teto, o lerp de transição vira pulo
    const delta = Math.min(rawDelta, 1 / 30)

    // retrato/paisagem com histerese — nada de user-agent
    const aspect = state.size.width / state.size.height
    if (aspect < 0.9) portrait.current = true
    else if (aspect > 1.1) portrait.current = false

    const def = VIEWS[view] ?? VIEWS.home
    const cam = (portrait.current && def.cameraPortrait) || def.camera

    _pos.set(...cam.position)
    _look.set(...cam.lookAt)

    // sem animação de entrada: o 1º frame nasce cravado no enquadramento da
    // view (o dono não gosta de voo/deriva de câmera no load)
    if (!snapped.current) {
      snapped.current = true
      state.camera.position.copy(_pos)
      state.camera.lookAt(_look)
      state.camera.fov = cam.fov ?? 40
      state.camera.updateProjectionMatrix()
      return
    }

    // 1 - Math.exp(-lambda * delta) is the framerate-independent way to lerp
    const lerpFactor = 1 - Math.exp(-4 * delta)

    // (sem parallax de mouse: a câmera se mexer com o ponteiro enjoava o dono)

    state.camera.position.lerp(_pos, lerpFactor)
    _m.lookAt(state.camera.position, _look, state.camera.up)
    _q.setFromRotationMatrix(_m)
    state.camera.quaternion.slerp(_q, lerpFactor)

    const targetFov = cam.fov ?? 40
    if (Math.abs(state.camera.fov - targetFov) > 0.05) {
      state.camera.fov += (targetFov - state.camera.fov) * lerpFactor
      state.camera.updateProjectionMatrix()
    }
  })
  return null
}

/**
 * A cena é estática (nada que projeta sombra se move): o shadow map roda em
 * modo manual e este componente o re-renderiza por alguns frames quando um
 * pedaço novo monta (Suspense resolvendo, pedal lazy chegando). Sem isso o
 * passe de sombra re-desenhava ~20 casters em TODO frame, à toa.
 */
function Kick({ frames, onDone }) {
  const { gl } = useThree()
  const left = useRef(frames)
  useFrame(() => {
    gl.shadowMap.needsUpdate = true
    left.current--
    if (left.current <= 0) onDone()
  })
  return null
}

/**
 * Guarda de contexto WebGL. O navegador descarta a GPU de aba em background
 * (o dono viu voltando do alt+tab): o three reenvia texturas normais sozinho,
 * mas o que mora em RENDER TARGET não tem como voltar, porque não existe cópia
 * em CPU. São dois aqui: o atlas assado da chama (some) e o SHADOW MAP — e o
 * shadow map é pior, porque com `autoUpdate = false` ele nunca é redesenhado,
 * então as superfícies grandes (chão, parede, tapete, mesa) ficam pretas, como
 * se estivessem em sombra total.
 *
 * O `visibilitychange` é rede de segurança: se o mapa se perder sem que venha
 * o evento de restauração, voltar pra aba redesenha ele. Custa um passe de
 * sombra 512², só na volta.
 */
function ContextGuard({ onRestored }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const el = gl.domElement
    const restored = () => onRestored()
    const visible = () => {
      if (!document.hidden) gl.shadowMap.needsUpdate = true
    }
    el.addEventListener('webglcontextrestored', restored)
    document.addEventListener('visibilitychange', visible)
    return () => {
      el.removeEventListener('webglcontextrestored', restored)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [gl, onRestored])
  return null
}

function ShadowKick({ frames = 10 }) {
  // gastos os N frames o callback é DESMONTADO: um useFrame vivo pra sempre só
  // pra testar um contador ainda entra no loop de callbacks em todo frame
  const [alive, setAlive] = useState(true)
  const stop = useCallback(() => setAlive(false), [])
  return alive ? <Kick frames={frames} onDone={stop} /> : null
}

/**
 * Prepara a cena SEM ligar o frameloop (que fica 'never' até a revelação, pra
 * não gastar GPU num quarto invisível atrás do loader — mobile agradece):
 * compila os shaders em paralelo e desenha o quarto em fatias, um programa por
 * frame (ver scene/warmup.js). Sem isso, a estreia de todos os materiais caía
 * num frame só: ~1s de thread parada com o loader na tela, o que fazia a moeda
 * congelar no meio do giro. E sem os frames de aquecimento, esse mesmo custo
 * cairia no 1º frame DA REVELAÇÃO, com o canvas ainda vazio (o flash preto).
 * Só quando tudo está quente dispara `onReady`.
 */
function CompileGate({ onReady }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const advance = useThree((s) => s.advance)
  useEffect(
    () => warmScene({ gl, scene, camera, advance, onReady, shadows: true }),
    [gl, scene, camera, advance, onReady]
  )
  return null
}

// teto de dpr por device: min(2, devicePixelRatio). No desktop 1080p (dpr 1) dá
// 1 (o 1.25 estourava fill-rate — era SUPERSAMPLE acima da tela). No mobile
// (dpr 2-4) dá 2, o mínimo pra cena 3D não sair borrada (render em 1/3 da
// resolução deixava tudo embaçado, só o texto/DOM saía nítido).
const MAX_DPR = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)

export function Scene({ view, onNavigate, labels, reducedMotion, markers, active = true, dimRef, onReady }) {
  const [dpr, setDpr] = useState(MAX_DPR)
  const showMarkers = view === 'home' && !reducedMotion
  // incrementa a cada restauração de contexto, pra remontar o ShadowKick e
  // redesenhar o shadow map perdido (o atlas da chama se recupera sozinho,
  // dentro do Fire.jsx)
  const [ctxGen, setCtxGen] = useState(0)
  const handleRestored = useCallback(() => setCtxGen((g) => g + 1), [])

  // NOTA: sem localClippingEnabled no gl. Os clipping planes são do chassi do
  // pedal, que roda no OUTRO canvas (SectionPedal habilita o dele). Ligado aqui
  // à toa, todo shader da cena carregava os uniforms de clipping.
  return (
    <Canvas
      camera={{ position: VIEWS.home.camera.position, fov: 40 }}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, alpha: true, toneMappingExposure: L.exposure }}
      onCreated={({ gl }) => {
        // sombra em modo manual: o ShadowKick atualiza quando algo monta
        gl.shadowMap.autoUpdate = false
        // Em produção o three NÃO checa erro de shader. A checagem parece de
        // graça e não é: ler getProgramInfoLog obriga a CPU a esperar o driver
        // terminar de linkar aquele programa, e isso se repete a cada estreia.
        // Medido com o aquecimento em pé: ~800ms a menos de thread travada na
        // montagem. Em dev fica ligada, senão shader quebrado falha calado.
        gl.debug.checkShaderErrors = import.meta.env.DEV
      }}
      dpr={dpr}
      shadows
    >
      {/* flipflops limita a 2 oscilações — evita "ticks" visíveis de resolução.
          Teto = MAX_DPR (min(2, devicePixelRatio)): nunca supersample. Se a GPU
          sofrer, cai proporcional pra segurar 60fps sem ficar preto/borrado. */}
      <PerformanceMonitor
        flipflops={2}
        onIncline={() => setDpr(MAX_DPR)}
        onDecline={() => setDpr(Math.max(1, MAX_DPR * 0.7))}
        onFallback={() => setDpr(Math.max(1, MAX_DPR * 0.6))}
      />
      <CameraController view={view} />

      <Suspense fallback={null}>
        {/* névoa quente — funde as bordas do chão na golden hour */}
        <fog attach="fog" args={[L.fog, 26, 60]} />

        {/* fill ambiente morno e generoso — o quarto não é mais noturno. Sobe
            14% pra repor o piso de luz das point lights cortadas */}
        <ambientLight intensity={AMBIENT_INTENSITY} color={L.ambient.color} />

        {/* Sol baixo entrando pela janela (golden hour): quente e direcional.
            Fica LONGE na mesma direção (o vetor antigo era [-7, 4.5, 2], este é
            ele vezes 3): direcional não tem atenuação, então a luz não muda,
            mas a câmera de sombra passa a ver o quarto inteiro pela frente.
            Perto assim, parte dos móveis caía ATRÁS dela e simplesmente não
            entrava no shadow map.

            Os limites do quadro de sombra são medidos, não chutados: a caixa
            dos 47 casters projetada no espaço desta câmera é x[-13.9, 2.7]
            y[-16.1, 14.5] z[3.4, 52.7]. O quadro antigo (±10, far 30) cortava
            os três eixos, e o corte aparecia como uma borda reta de luz na
            parede, bem visível na view do quadro. Enquadrando o que existe de
            verdade, o mapa 1024 rende ~60 texels por unidade contra os ~26 de
            antes, e o passe de sombra continua custando o mesmo: ele roda em
            modo manual, só quando algo monta. Se entrar móvel novo longe do
            centro, medir de novo. */}
        <directionalLight
          position={[-21, 13.5, 6]}
          intensity={L.sun.intensity}
          color={L.sun.color}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={1}
          shadow-camera-far={56}
          shadow-camera-left={-14.5}
          shadow-camera-right={3.5}
          shadow-camera-top={15}
          shadow-camera-bottom={-17}
          shadow-bias={-0.001}
        />

        {/* céu frio de contraponto — impede que fique tudo laranja chapado */}
        <hemisphereLight args={[L.hemi.sky, L.hemi.ground, L.hemi.intensity]} />

        {/* NOTA DE PERF: o feixe (spot) e os 3 point lights de "wash" da parede
            foram removidos. Cada luz custava por PIXEL em toda a cena; a parede
            agora se ilumina sozinha via emissive (L.wallEmissive em Room.jsx) —
            custo zero e resolve inclusive a parede acima da janela no retrato. */}

        {/* The room: floor, walls, desk, window, painting, shelves, furniture */}
        <Room
          onNavigate={onNavigate}
          labels={labels}
          activeView={view}
          markers={{ about: showMarkers && markers?.about }}
        />

        {/* RetroPC na mesa — decorativo: a tela só passa o reel do verve
            (não é mais clicável/jogável) */}
        <group position={[3.2, 0, -4.2]} rotation-y={-0.22}>
          <RetroPC dimRef={dimRef} />
          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.6}
            scale={9}
            blur={2.4}
            far={4}
            color="#000000"
            resolution={256}
            frames={1}
          />
        </group>

        {/* Canto musical: amp + vinis decorativos (o pedal do chão foi removido
            — perf: um pedal completo em scale 0.3 custava ~116 draw calls/frame
            + uma point light interna, só de enfeite). */}
        <ContextGuard onRestored={handleRestored} />
        {/* a key remonta o kick quando o contexto volta: o shadow map perdido
            precisa ser redesenhado, senão a cena fica preta */}
        <ShadowKick key={ctxGen} />
        <GuitarAmp position={[-4.5, -2.1, -5.0]} rotation={[0, 0.3, 0]} />
        <VinylCrate position={[-6.2, -2.1, -4.4]} rotation={[0, 0.7, 0]} />
        <ContactShadows
          position={[-3.6, -2.09, -4.2]}
          opacity={0.7}
          scale={7}
          blur={2.2}
          far={3}
          color="#000000"
          resolution={256}
          frames={1}
        />
        {/* (a luz de canto âmbar foi REMOVIDA, mesmo no desktop: era wash
            estático, e o mobile já vivia sem ela. Sobre o custo dela, ver a
            nota em AMBIENT_INTENSITY — não deu ganho medível.) */}

        {/* compila os shaders (async, sem travar/renderizar) e libera o loader
            quando pronto; a cena só começa a renderizar na revelação */}
        <CompileGate onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}

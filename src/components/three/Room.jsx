import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox, useTexture } from '@react-three/drei'
import { Hotspot } from './Hotspot.jsx'
import { CandleCluster } from './Candles.jsx'
import { getLightPreset } from '../../scene/lighting.js'
import { useRoomTextures } from '../../scene/roomTextures.js'

// mesmo preset resolvido no load que a Scene lê (?light=) — escolhe a vista
// da janela e a cor da poeira do feixe
const L = getLightPreset()

const WOOD_DARK = '#3a2414'

/* ───────────────────────────────────────────────────────────
   Sub-components
   ─────────────────────────────────────────────────────────── */

/**
 * Janelinhas dos prédios acendendo/apagando devagar (vida no skyline).
 * Barato: uns poucos quads com opacity mutada por ref no useFrame —
 * zero setState, zero upload de textura. Coordenadas locais do grupo
 * da janela (plano da vista: 8.2×3.9; prédios na faixa de baixo).
 */
function CityLights() {
  const mats = useRef([])
  const lights = useMemo(
    () => [
      { x: -3.62, y: -1.6, speed: 0.31, phase: 0.5 },
      { x: -3.05, y: -1.15, speed: 0.22, phase: 2.1 },
      { x: -2.5, y: -1.66, speed: 0.27, phase: 4.2 },
      { x: -1.85, y: -0.95, speed: 0.19, phase: 1.3 },
      { x: -1.38, y: -1.5, speed: 0.33, phase: 3.7 },
      { x: -0.72, y: -1.72, speed: 0.24, phase: 5.5 },
      { x: -0.18, y: -1.2, speed: 0.29, phase: 0.9 },
      { x: 0.4, y: -1.58, speed: 0.21, phase: 2.8 },
      { x: 0.95, y: -0.9, speed: 0.26, phase: 4.9 },
      { x: 2.72, y: -1.62, speed: 0.23, phase: 1.8 },
      { x: 3.28, y: -1.1, speed: 0.3, phase: 3.2 },
      { x: 3.78, y: -1.68, speed: 0.2, phase: 5.1 },
    ],
    []
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    for (let i = 0; i < lights.length; i++) {
      const m = mats.current[i]
      if (!m) continue
      const l = lights[i]
      // pulso lento e suave, cada janela no seu ritmo
      const s = Math.sin(t * l.speed + l.phase)
      m.opacity = 0.1 + 0.75 * THREE.MathUtils.smoothstep(s, 0.35, 0.8)
    }
  })
  return lights.map((l, i) => (
    <mesh key={i} position={[l.x, l.y, 0.115]}>
      <planeGeometry args={[0.055, 0.07]} />
      <meshBasicMaterial
        ref={(m) => void (mats.current[i] = m)}
        color="#ffc576"
        transparent
        opacity={0.1}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  ))
}

/** Luz quente da mesa (sem luminária visível — o brilho vem "da bagunça"). */


/** Bloco de notas com caneta. */
function Notepad({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.5, 0.03, 0.68]} radius={0.008} position={[0, 0.015, 0]} castShadow>
        <meshStandardMaterial color="#e5dfd0" roughness={0.95} />
      </RoundedBox>
      {/* linhas do caderno */}
      {[0.14, 0.04, -0.06, -0.16].map((z) => (
        <mesh key={z} position={[0, 0.032, z]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.4, 0.008]} />
          <meshBasicMaterial color="#8a94a8" />
        </mesh>
      ))}
      {/* caneta */}
      <mesh position={[0.18, 0.05, 0.12]} rotation={[0, 0.7, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.42, 10]} />
        <meshStandardMaterial color="#8a1e1e" roughness={0.3} />
      </mesh>
    </group>
  )
}

/** Prateleiras suspensas na parede (parte do hotspot do "sobre"). */
function WallShelves() {
  const shelfBooks = [
    // prateleira de cima: par de livros à DIREITA (o porta-retrato mora à esquerda)
    [
      { w: 0.16, h: 0.5, color: '#2a3a4a', band: '#c9b083', lean: 0 },
      { w: 0.2, h: 0.55, color: '#4a2a20', band: '#d9c39a', lean: -0.16 },
    ],
    // prateleira de baixo concentra os livros
    [
      { w: 0.2, h: 0.52, color: '#4a3a1a', band: '#e2d2a2', lean: 0 },
      { w: 0.16, h: 0.46, color: '#1a3a3a', band: '#a9c0b4', lean: 0 },
      { w: 0.14, h: 0.5, color: '#2a4a30', band: '#cbb27a', lean: 0 },
      { w: 0.18, h: 0.56, color: '#4a1a2a', band: '#d3a6a6', lean: 0.16 },
    ],
  ]

  const boardY = [0.7, 0]

  return (
    <group>
      {boardY.map((y, si) => (
        <group key={si} position={[0, y, 0]}>
          {/* tábua */}
          <RoundedBox args={[2.3, 0.06, 0.34]} radius={0.01} castShadow>
            <meshStandardMaterial color={WOOD_DARK} roughness={0.6} />
          </RoundedBox>
          {/* mãos francesas */}
          {[-0.9, 0.9].map((x) => (
            <mesh key={x} position={[x, -0.09, -0.06]}>
              <boxGeometry args={[0.05, 0.14, 0.2]} />
              <meshStandardMaterial color="#141414" roughness={0.4} metalness={0.6} />
            </mesh>
          ))}
          {/* livros: corpo + faixas no lombo (não são mais só retângulos) e
              assentados na tábua (sem flutuar) */}
          {(() => {
            // cima: livros começam à direita do retrato; baixo: a partir da esquerda
            let bx = si === 0 ? 0.3 : -1.0
            return shelfBooks[si].map((b, bi) => {
              const x = bx + b.w / 2
              bx += b.w + 0.05
              const depth = 0.24 + (bi % 2) * 0.05
              return (
                <group
                  key={bi}
                  position={[x + (b.lean ? 0.05 : 0), 0.03 + b.h / 2 - Math.abs(b.lean) * 0.05, 0]}
                  rotation-z={b.lean}
                >
                  <RoundedBox args={[b.w, b.h, depth]} radius={0.006} castShadow>
                    <meshStandardMaterial color={b.color} roughness={0.88} />
                  </RoundedBox>
                  {/* faixas do lombo (título) */}
                  <mesh position={[0, b.h * 0.22, depth / 2 + 0.002]}>
                    <planeGeometry args={[b.w * 0.62, b.h * 0.05]} />
                    <meshStandardMaterial color={b.band} roughness={0.5} />
                  </mesh>
                  <mesh position={[0, b.h * 0.09, depth / 2 + 0.002]}>
                    <planeGeometry args={[b.w * 0.44, b.h * 0.022]} />
                    <meshStandardMaterial color={b.band} roughness={0.5} />
                  </mesh>
                </group>
              )
            })
          })()}
        </group>
      ))}
      {/* plantinha na ponta da prateleira de cima */}
      <group position={[0.95, 0.73, 0]} scale={0.45}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.12, 0.24, 12]} />
          <meshStandardMaterial color="#b8654a" roughness={0.9} />
        </mesh>
        {[
          [0, 0.36, 0, 0.13],
          [0.09, 0.3, 0.04, 0.09],
          [-0.08, 0.32, -0.03, 0.1],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[r, 8, 8]} />
            <meshStandardMaterial color="#2a5a30" roughness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ───────────────────────────────────────────────────────────
   Main Room Component
   ─────────────────────────────────────────────────────────── */

export function Room({ onNavigate, labels = {}, activeView, markers = {} }) {
  // assadas num worker (suspende até chegarem) — ver scene/roomTextures.js
  const { floor: woodTex, rug: rugTex, wall: wallTex, window: skyTex } = useRoomTextures(L.sky)
  const collageTex = useTexture('/img/ghost-collage-tex.jpg')
  const kidTex = useTexture('/img/vini-kid.jpg')

  /**
   * Tudo do quarto que NÃO depende da view, memoizado.
   *
   * Trocar de view muda `activeView`, que existe aqui por um motivo só: o
   * `disabled` do Hotspot do porta-retrato. Sem isto, esse booleano fazia os
   * ~100 elementos R3F do quarto reconciliarem junto. Medido com o profiler de
   * amostragem (CPU a 4x): ~51ms de commitUpdate/reconciliação por troca, que
   * eram as long tasks de 50-63ms no frame em que a câmera começa a andar.
   *
   * Guardando os ELEMENTOS num useMemo, a identidade deles não muda entre
   * renders e o React descarta a subárvore inteira do diff. As texturas são a
   * única dependência real (vêm do cache do worker).
   */
  const quarto = useMemo(
    () => (
      <>
      {/* ─── Floor ─── */}
      <mesh position={[0, -2.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial map={woodTex} roughness={0.75} />
      </mesh>

      {/* ─── Rug (horizontal, empurrado pra trás — encostado sob a mesa/parede) ─── */}
      <mesh position={[0.2, -2.09, -1.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9.2, 6.2]} />
        <meshStandardMaterial map={rugTex} roughness={1} transparent />
      </mesh>

      {/* ─── Back Wall ─── */}
      {/* auto-brilho leve (emissive) no lugar dos antigos 3 point lights de
          wash: garante um piso de luminosidade na parede inteira (inclusive
          acima da janela no retrato) sem pesar no loop de luzes por pixel */}
      <mesh position={[0, 4, -6]} receiveShadow>
        <planeGeometry args={[60, 20]} />
        <meshStandardMaterial
          map={wallTex}
          emissiveMap={wallTex}
          emissive={L.wallEmissive.color}
          emissiveIntensity={L.wallEmissive.intensity}
          roughness={0.9}
        />
      </mesh>

      {/* ─── Baseboard ─── */}
      <mesh position={[0, -1.95, -5.85]} castShadow>
        <boxGeometry args={[60, 0.3, 0.12]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
      </mesh>

      {/* ─── Desk (mais funda: o PC precisa caber inteiro) — encostada na parede ─── */}
      <group position={[3, -2.1, -3.5]}>
        {/* Table top */}
        <RoundedBox args={[8, 0.18, 4.4]} radius={0.03} position={[0, 2.1, 0]} receiveShadow castShadow>
          <meshStandardMaterial color={WOOD_DARK} roughness={0.55} />
        </RoundedBox>
        {/* Front apron */}
        <mesh position={[0, 1.95, 2.1]} castShadow>
          <boxGeometry args={[7.8, 0.15, 0.06]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.6} />
        </mesh>
        {/* Legs */}
        {[-3.7, 3.7].map((x) =>
          [-1.9, 1.9].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 1.05, z]} receiveShadow castShadow>
              <boxGeometry args={[0.2, 2.1, 0.2]} />
              <meshStandardMaterial color={WOOD_DARK} roughness={0.6} />
            </mesh>
          ))
        )}
      </group>

      {/* ─── Desk props ─── */}
      {/* (DeskGlow removido: o fogo do CRT já joga luz quente na mesa; era mais
          uma point light custando por pixel na cena toda) */}
      <Notepad position={[5.2, 0.1, -3.1]} rotation={[0, 0.35, 0]} />

      {/* ─── Cozy: velas no parapeito da janela ─── */}
      <CandleCluster position={[-2.55, 1.21, -5.68]} />

      {/* (a poeira flutuando no feixe da janela foi REMOVIDA: o volume ocupava
          z de -5.2 a -2.6 e a câmera do "sobre" para em z=-2.05 olhando pra
          dentro dele, então as 35 partículas passavam a ~0.5-3 unidades da
          lente e, com atenuação por distância, viravam quads transparentes do
          tamanho da tela — 35 camadas empilhadas em tela cheia, estouro de
          fill-rate que travava a entrada no "sobre". O dono também não gostava
          do efeito.) */}

      {/* (estante + porta-retrato vivem juntos no hotspot do "sobre", mais abaixo) */}

      {/* ─── Window (panorâmica, maior, atrás do lockup do título) ─── */}
      <group position={[-5.2, 3.4, -5.9]}>
        {/* Outer frame */}
        <RoundedBox args={[8.8, 4.5, 0.2]} radius={0.05} castShadow>
          <meshStandardMaterial color="#2d3340" roughness={0.5} />
        </RoundedBox>
        {/* Golden hour view */}
        <mesh position={[0, 0, 0.11]}>
          <planeGeometry args={[8.2, 3.9]} />
          <meshBasicMaterial map={skyTex} toneMapped={false} />
        </mesh>
        {/* janelinhas dos prédios acendendo/apagando */}
        <CityLights />
        {/* leve reflexo de vidro */}
        <mesh position={[0, 0, 0.12]}>
          <planeGeometry args={[8.2, 3.9]} />
          <meshStandardMaterial
            color="#e0b88a"
            roughness={0.08}
            metalness={0.3}
            transparent
            opacity={0.08}
          />
        </mesh>
        {/* Cross bars: 1 horizontal + 2 verticais (3 panos) */}
        <RoundedBox args={[8.4, 0.09, 0.08]} radius={0.02} position={[0, 0, 0.13]}>
          <meshStandardMaterial color="#1e2530" roughness={0.4} metalness={0.3} />
        </RoundedBox>
        {[-1.37, 1.37].map((x) => (
          <RoundedBox key={x} args={[0.09, 4.0, 0.08]} radius={0.02} position={[x, 0, 0.13]}>
            <meshStandardMaterial color="#1e2530" roughness={0.4} metalness={0.3} />
          </RoundedBox>
        ))}
        {/* Window sill */}
        <RoundedBox args={[9.2, 0.1, 0.4]} radius={0.02} position={[0, -2.25, 0.15]} castShadow>
          <meshStandardMaterial color="#2d3340" roughness={0.5} />
        </RoundedBox>
      </group>

      {/* ─── Pôster colagem GHOSTFX: papel colado direto na parede (sem
          moldura), levemente torto, com fita adesiva nos cantos. Deslocado
          pra DIREITA das chamas do CRT (o glow do fogo estourava sobre ele) ─── */}
      <group position={[5.75, 3.5, -5.965]} rotation-z={-0.028}>
        <mesh castShadow>
          <planeGeometry args={[2.5, 1.42]} />
          <meshStandardMaterial map={collageTex} roughness={0.92} />
        </mesh>
        {[
          [-1.17, 0.63, 0.7],
          [1.17, 0.63, -0.7],
          [-1.17, -0.63, -0.7],
          [1.17, -0.63, 0.7],
        ].map(([x, y, rz], i) => (
          <mesh key={i} position={[x, y, 0.006]} rotation-z={rz}>
            <planeGeometry args={[0.32, 0.11]} />
            <meshStandardMaterial color="#d8d4c8" transparent opacity={0.5} roughness={0.45} />
          </mesh>
        ))}
      </group>

      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [woodTex, rugTex, wallTex, skyTex, collageTex, kidTex]
  )

  return (
    <group>
      {quarto}
      {/* ─── Estante + porta-retrato = hotspot do "sobre". A estante INTEIRA
          (prateleiras, livros, cubo mágico, foto) é clicável e faz hover, pra
          ser bem fácil de perceber ─── */}
      <Hotspot
        label={labels.painting}
        labelPosition={[0.0, 4.25, -5.55]}
        onActivate={() => onNavigate?.('about')}
        disabled={activeView === 'about'}
        marker={markers.about}
      >
        {(hovered) => (
          <>
            {/* prateleiras + luz de leitura */}
            <group position={[0.55, 2.62, -5.78]}>
              <WallShelves />
              <pointLight position={[0, 0.4, 1.2]} color="#ffd090" intensity={1.6} distance={4} decay={2} />
            </group>
            {/* porta-retrato em pé na PONTA ESQUERDA da prateleira de cima:
                na view about ele fica ao lado do texto (que mora sobre a janela) */}
            <group position={[0.0, 3.74, -5.72]} rotation-x={-0.07}>
              <RoundedBox args={[1.06, 0.78, 0.14]} radius={0.025} castShadow>
                <meshStandardMaterial color={hovered ? '#2e2218' : '#1a1510'} roughness={0.7} metalness={0.1} />
              </RoundedBox>
              <mesh position={[0, 0, 0.08]}>
                <planeGeometry args={[0.94, 0.66]} />
                <meshStandardMaterial color="#e8e2d2" roughness={1} />
              </mesh>
              <mesh position={[0, 0, 0.09]}>
                <planeGeometry args={[0.86, 0.57]} />
                <meshStandardMaterial map={kidTex} roughness={0.9} />
              </mesh>
            </group>
          </>
        )}
      </Hotspot>
    </group>
  )
}

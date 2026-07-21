/**
 * Presets de iluminação do quarto, escolhidos por query param (?light=dusk).
 * As POSIÇÕES das luzes não mudam entre presets (sombra assada no mount via
 * ShadowKick; mover luz depois não re-renderiza o shadow map) — só cor,
 * intensidade, névoa e exposição.
 *
 * night   = ESCOLHIDO pelo dono (2026-07-19), é o default: luar frio pela
 *           janela, interior vive do fogo, céu noturno com lua na vista
 * golden  = o antigo pôr do sol quente
 * dusk    = crepúsculo: sol mais baixo e vermelho, céu roxo-rosado
 * day     = fim de manhã: luz neutra clara, quarto arejado
 *
 * `sky` escolhe a textura da vista da janela (Room.jsx); `dust` tinge a
 * poeira do feixe da janela; `wallEmissive` é o auto-brilho da parede do
 * fundo — substitui os antigos point lights de "wash" (custo zero por
 * fragmento, não entram no loop de luzes) e mantém a parede legível, inclusive
 * acima da janela no retrato.
 */
export const LIGHT_PRESETS = {
  night: {
    exposure: 1.12,
    sky: 'night',
    dust: '#aac4ff',
    fog: '#0c0e15',
    ambient: { color: '#9aa2c0', intensity: 0.62 },
    sun: { color: '#9db4e8', intensity: 0.95 },
    hemi: { sky: '#5f7099', ground: '#2a2320', intensity: 0.5 },
    corner: { color: '#f5a623', intensity: 3.0 },
    wallEmissive: { color: '#39303c', intensity: 0.6 },
  },

  golden: {
    exposure: 1.4,
    sky: 'sunset',
    dust: '#ffd9a0',
    fog: '#1a1512',
    ambient: { color: '#d3c1a0', intensity: 1.4 },
    sun: { color: '#ffb266', intensity: 1.9 },
    hemi: { sky: '#9db0d8', ground: '#4a3a2e', intensity: 0.45 },
    corner: { color: '#f5a623', intensity: 2.4 },
    wallEmissive: { color: '#5a4632', intensity: 1.35 },
  },

  dusk: {
    exposure: 1.3,
    sky: 'sunset',
    dust: '#f2bda0',
    fog: '#171021',
    ambient: { color: '#af92a4', intensity: 0.92 },
    sun: { color: '#ff704a', intensity: 2.0 },
    hemi: { sky: '#8087d6', ground: '#3c2e3c', intensity: 0.6 },
    corner: { color: '#f5a623', intensity: 2.8 },
    wallEmissive: { color: '#3f2a34', intensity: 0.82 },
  },

  day: {
    exposure: 1.5,
    sky: 'sunset',
    dust: '#fff2d0',
    fog: '#1f1b16',
    ambient: { color: '#dbd3c3', intensity: 1.35 },
    sun: { color: '#fff1d4', intensity: 2.0 },
    hemi: { sky: '#bcd0ea', ground: '#5a4c3e', intensity: 0.6 },
    corner: { color: '#f5a623', intensity: 1.9 },
    wallEmissive: { color: '#4a4038', intensity: 1.05 },
  },
}

export function getLightPreset() {
  const key = new URLSearchParams(window.location.search).get('light')
  return LIGHT_PRESETS[key] ?? LIGHT_PRESETS.golden
}

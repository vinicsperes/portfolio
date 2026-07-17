import { PedalScene } from './pedal/scene'

const GREEN = '#16a030'
const palette = {
  pedal: '#1a1a1c',
  ink: '#ffffff',
  accent: GREEN,
  cream: '#f4f0e6',
  metal: '#d4d4d4',
}

/**
 * O pedal Ghost como objeto físico do quarto: estático, fechado e decorativo
 * (scale 0.3 no chão). `showCircuit={false}`: o interior nunca é visto aqui e
 * custava ~500 draw calls por frame no hero.
 */
export function GhostPedal() {
  return (
    <PedalScene
      palette={palette}
      explode={0}
      split={false}
      showCircuit={false}
      simple
      hideTag
      ledColor={GREEN}
      ledActive={false}
    />
  )
}

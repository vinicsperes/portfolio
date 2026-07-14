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
 * O pedal Ghost como objeto físico do quarto: estático e fechado. O clique
 * que leva à seção Ghost é tratado pelo Hotspot que o embrulha na Scene.
 */
export function GhostPedal() {
  return (
    <PedalScene
      palette={palette}
      explode={0}
      split={false}
      hideTag
      ledColor={GREEN}
      ledActive={false}
    />
  )
}

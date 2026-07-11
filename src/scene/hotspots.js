/**
 * Registro declarativo das views da cena: para cada view, a posição-alvo
 * da câmera, o ponto de lookAt e (opcional) fov. `cameraPortrait`
 * reenquadra quando o box da cena fica retrato (aspect < ~0.9).
 */
export const INTRO_START = { position: [-12, 7.5, 16], lookAt: [0, 1.5, -2] }

export const VIEWS = {
  // Composição full-bleed do hero: monitor à direita (a "tela dos trabalhos"),
  // janela e quadro à esquerda/centro — atrás da tipografia
  home: {
    camera: { position: [0.4, 3.05, 9.2], lookAt: [0.6, 1.15, -1.0] },
    cameraPortrait: { position: [1.4, 3.2, 12.5], lookAt: [1.6, 1.2, -1.2], fov: 50 },
  },
  // Zoom no porta-retrato pendurado na parede — o "sobre mim" mora na cena.
  // Leve 3/4 (vindo da esquerda): retrato à direita, texto respira à esquerda
  about: {
    camera: { position: [-0.35, 2.75, -3.35], lookAt: [0.58, 3.0, -5.86] },
    cameraPortrait: { position: [0.2, 2.8, -3.2], lookAt: [0.62, 3.05, -5.86], fov: 52 },
  },
}

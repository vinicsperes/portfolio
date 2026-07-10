/**
 * Registro declarativo das views da cena: para cada view, a posição-alvo
 * da câmera, o ponto de lookAt e (opcional) fov. `cameraPortrait`
 * reenquadra em telas retrato (aspect < ~0.9).
 */
export const INTRO_START = { position: [-12, 7.5, 16], lookAt: [0, 1.5, -2] }

export const VIEWS = {
  home: {
    camera: { position: [0, 3.5, 12], lookAt: [0, 1, 0] },
    cameraPortrait: { position: [0, 3.6, 17], lookAt: [1.2, 1, -1], fov: 50 },
  },
  // Zoom no monitor CRT — o terminal Verve assume a tela (HUD respira à esquerda)
  verve: {
    camera: { position: [2.38, 2.26, 0.99], lookAt: [2.65, 2.16, -2.54] },
    cameraPortrait: { position: [2.14, 2.31, 2.06], lookAt: [3.14, 2.16, -2.43], fov: 48 },
  },
  // Câmera baixa olhando o pedal Ghost no chão (pedal à direita, texto à esquerda)
  ghost: {
    camera: { position: [-1.35, -0.55, -0.35], lookAt: [-2.75, -1.5, -3.45] },
    cameraPortrait: { position: [-0.9, -0.1, 0.9], lookAt: [-2.35, -1.6, -3.3], fov: 48 },
  },
}

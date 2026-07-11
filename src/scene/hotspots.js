/**
 * Registro declarativo das views da cena: para cada view, a posição-alvo
 * da câmera, o ponto de lookAt e (opcional) fov. `cameraPortrait`
 * reenquadra em telas retrato (aspect < ~0.9).
 */
export const INTRO_START = { position: [-12, 7.5, 16], lookAt: [0, 1.5, -2] }

export const VIEWS = {
  home: {
    // um passo à frente: menos parede sobrando nas laterais
    camera: { position: [0, 3.15, 9.6], lookAt: [0, 1.05, -0.4] },
    cameraPortrait: { position: [0, 3.5, 15], lookAt: [1.2, 1, -1], fov: 50 },
  },
  // Zoom no porta-retrato apoiado na prateleira — o "sobre mim" mora na cena.
  // Leve 3/4 (vindo da esquerda): retrato + prateleira à direita, texto à esquerda
  about: {
    camera: { position: [-0.1, 3.28, -3.4], lookAt: [0.83, 3.62, -5.74] },
    cameraPortrait: { position: [0.45, 3.3, -3.25], lookAt: [0.87, 3.65, -5.74], fov: 52 },
  },
  // Zoom no monitor CRT — o terminal Verve assume a tela (HUD respira à esquerda)
  verve: {
    camera: { position: [2.38, 2.26, 0.99], lookAt: [2.65, 2.16, -2.54] },
    cameraPortrait: { position: [2.14, 2.31, 2.06], lookAt: [3.14, 2.16, -2.43], fov: 48 },
  },
  // Câmera baixa olhando o pedal Ghost no chão, centralizado no palco,
  // com folga no topo para o chassi abrir no scroll
  ghost: {
    camera: { position: [-1.7, -0.95, -1.15], lookAt: [-2.45, -1.72, -3.35] },
    cameraPortrait: { position: [-1.3, -0.6, -0.4], lookAt: [-2.35, -1.7, -3.3], fov: 48 },
  },
}

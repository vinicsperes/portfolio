/**
 * Registro declarativo das views da cena: para cada view, a posição-alvo
 * da câmera, o ponto de lookAt e (opcional) fov. `cameraPortrait`
 * reenquadra em telas retrato (aspect < ~0.9).
 */
// A câmera nasce já no enquadramento do hero — sem voo de longe (o dono não
// gostou da animação de entrada). Espelha VIEWS.home.
export const INTRO_START = { position: [0, 3.05, 7.7], lookAt: [0, 1.15, -1.4] }

export const VIEWS = {
  home: {
    // mais um passo à frente: entra no quarto, mesa/tapete encostados na parede
    camera: { position: [0, 3.05, 7.7], lookAt: [0, 1.15, -1.4] },
    cameraPortrait: { position: [0, 3.4, 12.5], lookAt: [1.0, 1.1, -1.6], fov: 50 },
  },
  // Zoom no porta-retrato apoiado na prateleira — o "sobre mim" mora na cena.
  // Leve 3/4 (vindo da esquerda): retrato + prateleira à direita, texto à esquerda
  about: {
    camera: { position: [0, 3.15, -2.5], lookAt: [0.85, 3.15, -5.75], fov: 42 },
    cameraPortrait: { position: [0.5, 3.2, -2.3], lookAt: [0.9, 3.2, -5.75], fov: 54 },
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

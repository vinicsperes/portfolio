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
  // Zoom no porta-retrato (agora na ponta ESQUERDA da prateleira, x=0). A
  // câmera chega perto e mira à esquerda do quadro: a foto ocupa a metade
  // direita GRANDE e a coluna de texto cai inteira sobre a janela (fundo
  // suave = legível). No retrato (mobile), lookAt abaixo do quadro sobe a
  // foto pro terço superior e o texto ancora embaixo.
  about: {
    camera: { position: [-1.15, 3.55, -3.95], lookAt: [-0.45, 3.65, -5.72], fov: 42 },
    cameraPortrait: { position: [0.0, 3.0, -2.05], lookAt: [0.0, 2.85, -5.75], fov: 54 },
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

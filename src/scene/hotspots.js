/**
 * Registro declarativo das views da cena: para cada view, a posição-alvo
 * da câmera, o ponto de lookAt e (opcional) fov. `cameraPortrait`
 * reenquadra em telas retrato (aspect < ~0.9).
 */
// SEM animação de entrada: a câmera nasce cravada no enquadramento da view
// (o dono não gosta de voo/deriva de câmera no load — já foi removido 2x)
export const VIEWS = {
  home: {
    // câmera mais alta e olhando mais pra baixo: o chão/tapete ganham peso
    // na composição e a faixa de parede acima da janela quase some
    camera: { position: [0, 3.5, 8.0], lookAt: [0, 0.8, -1.4] },
    // topo do enquadramento COMEÇA no topo da janela (nada de parede acima);
    // o resto da tela fica com mesa/tapete/chão
    cameraPortrait: { position: [0, 3.9, 12.5], lookAt: [1.0, -0.9, -1.6], fov: 50 },
  },
  // Zoom no porta-retrato (agora na ponta ESQUERDA da prateleira, x=0). A
  // câmera chega perto e mira à esquerda do quadro: a foto ocupa a metade
  // direita GRANDE e a coluna de texto cai inteira sobre a janela (fundo
  // suave = legível). No retrato (mobile), lookAt abaixo do quadro sobe a
  // foto pro terço superior e o texto ancora embaixo.
  // A estante desceu 0.55 e andou 0.40 pra direita em 2026-08-03; estas duas
  // câmeras foram transladadas do MESMO tanto, então o enquadramento da foto
  // ficou idêntico ao que o dono já tinha aprovado. Se a estante mudar de
  // lugar de novo, mover as duas junto (Room.jsx, grupo do porta-retrato).
  about: {
    camera: { position: [-0.75, 3.0, -3.95], lookAt: [-0.05, 3.1, -5.72], fov: 42 },
    cameraPortrait: { position: [0.4, 2.45, -2.05], lookAt: [0.4, 2.3, -5.75], fov: 54 },
  },
}

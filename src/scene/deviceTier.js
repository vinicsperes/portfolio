/**
 * Tier do dispositivo, resolvido UMA vez no load (igual ao getLightPreset):
 * é constante de módulo, não hook — nada aqui provoca re-render.
 *
 * `pointer: coarse` é o mesmo sinal que o CSS já usa pra desligar o
 * scroll-snap (index.css), então o projeto tem um conceito só de "mobile".
 * O limite de largura evita pegar notebook com tela sensível ao toque.
 *
 * Nada disso mexe em RESOLUÇÃO: o dpr do hero segue em min(2, devicePixelRatio).
 * O que o tier corta é custo POR PIXEL (luzes, oitavas de ruído) e trabalho
 * duplicado (contextos WebGL, HDRI, draw calls) — a cena não sai borrada.
 */
export const IS_MOBILE =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches &&
  window.matchMedia('(max-width: 1024px)').matches

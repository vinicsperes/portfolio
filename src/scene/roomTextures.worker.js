/**
 * Assa as texturas procedurais do quarto fora da main thread. Recebe a lista
 * de nomes, pinta cada uma num OffscreenCanvas e devolve ImageBitmaps
 * transferidos (custo zero de cópia na volta).
 *
 * `imageOrientation: 'flipY'` e `premultiplyAlpha: 'none'` NÃO são detalhe:
 * a three ignora `texture.flipY`/`premultiplyAlpha` quando a fonte é
 * ImageBitmap (WebGLTextures pula o pixelStorei nesse caso), então o bitmap
 * precisa chegar já na orientação que a CanvasTexture antiga produzia.
 */
import { paintTexture, textureSize } from './roomPainters.js'

self.onmessage = async (e) => {
  // as escalas vêm de fora: quem sabe o tier do aparelho é a main thread
  const { names, sky, scales = {} } = e.data
  try {
    const bitmaps = {}
    for (const name of names) {
      const scale = scales[name] ?? 1
      const { w, h } = textureSize(name, scale)
      const canvas = new OffscreenCanvas(w, h)
      paintTexture(name, canvas.getContext('2d'), sky, scale)
      bitmaps[name] = await createImageBitmap(canvas, {
        imageOrientation: 'flipY',
        premultiplyAlpha: 'none',
      })
    }
    self.postMessage({ bitmaps }, Object.values(bitmaps))
  } catch (err) {
    self.postMessage({ error: String(err) })
  }
}

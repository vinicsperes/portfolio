// teto de espera pelo driver antes de acender a cena de qualquer jeito
const COMPILE_TIMEOUT_MS = 2500

/**
 * Aquecimento de cena three: prepara tudo o que a GPU precisa ANTES de a cena
 * aparecer, sem travar a página no meio.
 *
 * O que custa caro não é traduzir o shader, é o PRIMEIRO desenho de cada
 * programa: aí o three lê os uniforms dele, e essa leitura obriga a CPU a
 * esperar o driver terminar de linkar. Com todos os materiais estreando no
 * mesmo frame, isso vira uma trava de quase um segundo (medido: ~900ms no
 * pedal do GHOSTFX, ~1s no quarto) — e no pedal ela caía justamente em cima do
 * primeiro scroll do visitante, que é quando a seção monta.
 *
 * Então o aquecimento vai em fatias: um lote por PROGRAMA, um por frame, cada
 * um pagando a própria estreia. A cena fica escondida enquanto isso (os dois
 * canvases têm loader por cima) e só reaparece inteira no frame final.
 *
 * Precisa de `advance` (do R3F) porque o canvas está em `frameloop` never/demand
 * nessa hora: quem desenha aqui somos nós.
 *
 * Devolve uma função de cancelamento — chame-a no cleanup do effect.
 */
export function warmScene({ gl, scene, camera, advance, onReady, shadows = false }) {
  let alive = true
  let raf = 0
  let hidden = []

  // um lote por programa. Fatiar por MATERIAL seria errado: o pedal tem ~500
  // meshes com um material inline cada, mas o three reaproveita o mesmo
  // programa entre materiais equivalentes e sobram uns doze. Por material
  // seriam 500 frames de aquecimento (oito segundos, medidos).
  const buildQueue = () => {
    const byProgram = new Map()
    scene.traverse((o) => {
      if (!o.material || o.visible === false) return
      const m = Array.isArray(o.material) ? o.material[0] : o.material
      // o programa de cada material só existe depois do compile: por isso a
      // fila é montada aqui dentro, e não antes de compilar
      const key = gl.properties.get(m)?.currentProgram?.id ?? m.type
      const batch = byProgram.get(key)
      if (batch) batch.push(o)
      else byProgram.set(key, [o])
    })
    return [...byProgram.values()]
  }

  const start = () => {
    if (!alive) return
    const queue = buildQueue()
    hidden = queue.flat()
    for (const o of hidden) o.visible = false

    const warmNext = () => {
      if (!alive) return
      const batch = queue.shift()
      if (!batch) {
        for (const o of hidden) o.visible = true
        // o passe de sombra do frame final precisa da cena inteira: durante o
        // aquecimento ela estava em pedaços
        if (shadows) gl.shadowMap.needsUpdate = true
        advance(performance.now())
        return onReady?.()
      }
      for (const o of batch) o.visible = true
      advance(performance.now())
      for (const o of batch) o.visible = false
      raf = requestAnimationFrame(warmNext)
    }
    warmNext()
  }

  // Rede de segurança: nada aqui pode depender de uma promise que talvez nunca
  // volte. O canvas do pedal fica em `frameloop="never"` até este aquecimento
  // liberar, então um `compileAsync` que engasgue (driver estranho, contexto
  // perdido no meio) deixaria o pedal invisível PRA SEMPRE, com o loader eterno
  // por cima. Passado o teto, a cena acende do mesmo jeito: pior um frame
  // pesado do que um pedal que não vem.
  let began = false
  const beginOnce = () => {
    if (began) return
    began = true
    clearTimeout(guard)
    start()
  }
  const guard = setTimeout(beginOnce, COMPILE_TIMEOUT_MS)

  // o link roda em paralelo no driver (KHR_parallel_shader_compile) enquanto a
  // thread segue livre; só depois vêm os frames de aquecimento
  if (gl.compileAsync) gl.compileAsync(scene, camera).then(beginOnce, beginOnce)
  else {
    gl.compile(scene, camera)
    beginOnce()
  }

  return () => {
    alive = false
    clearTimeout(guard)
    cancelAnimationFrame(raf)
    for (const o of hidden) o.visible = true
  }
}

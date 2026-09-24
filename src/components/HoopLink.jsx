import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { links } from '../content/index.js'

// cores tiradas dos próprios balões da foto
const BALOES = [
  { cor: '#ee6878', x: '-1em', lift: '1.55em', fx: '-1.6em', r: '-16deg', d: '0ms' },
  { cor: '#f3e6df', x: '0.15em', lift: '1.95em', fx: '0.4em', r: '6deg', d: '60ms' },
  { cor: '#f5b73e', x: '1.1em', lift: '1.6em', fx: '1.9em', r: '18deg', d: '120ms' },
]

// quanto a navegação espera pra os balões começarem a subir. Fica bem abaixo
// de 1s: o Safari só deixa o window.open passar se ele acontecer até ~1s
// depois do clique (Chrome e Firefox dão 5s).
const ESPERA_MS = 420
// soltou, subiu, sumiu: aí os balões voltam escondidos atrás da foto
const REARMA_MS = 1300

function Balao({ cor }) {
  return (
    <svg viewBox="0 0 16 46" className="hoop-balao-svg" aria-hidden="true">
      <path
        d="M8 20.2c0 3.4-1.8 5.6-.4 9s1.6 6.4.2 9.6-.9 5.2.2 7.2"
        fill="none"
        stroke="rgba(234,232,227,0.55)"
        strokeWidth="0.7"
      />
      <path d="M6.5 20.6 8 18.4l1.5 2.2z" fill={cor} />
      <path
        d="M8 .8c4.6 0 7.2 3.8 7.2 8.2 0 4.8-3.8 9-7.2 9.6C4.6 18 .8 13.8.8 9 .8 4.6 3.4.8 8 .8z"
        fill={cor}
      />
      <ellipse cx="5.2" cy="5.6" rx="1.5" ry="2.6" transform="rotate(-24 5.2 5.6)" fill="#fff" opacity="0.45" />
    </svg>
  )
}

/**
 * A foto da quadra, na faixa de marcas do hero, como link pro GitHub.
 *
 * A foto é chapada, quadrada e sem moldura, como as outras marcas da faixa.
 * O prazer está no clique: ela afunda na pressão e volta com mola, e os três
 * balões que espiavam por trás dela são SOLTOS e sobem por cima do nome.
 * A aba do GitHub só abre ~0,4s depois, pra dar tempo de ver a soltura
 * começar. Clique com modificador (Ctrl/Cmd/Shift, botão do meio) segue o
 * caminho normal do navegador, sem espera, e com movimento reduzido também.
 *
 * Os estados vão no `data-state` e o CSS (index.css, `.hoop`) faz o resto:
 * idle -> released (balões voando) -> reset (volta instantânea, sem
 * transição, pra ninguém ver balão descendo) -> idle.
 */
export function HoopLink({ className = '' }) {
  const reduced = useReducedMotion()
  const [estado, setEstado] = useState('idle')
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const onClick = (e) => {
    if (reduced || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    if (estado !== 'idle') return
    setEstado('released')
    timers.current.push(
      setTimeout(() => {
        const aba = window.open(links.github, '_blank')
        if (aba) aba.opener = null
        else window.location.href = links.github
      }, ESPERA_MS),
      setTimeout(() => {
        setEstado('reset')
        // dois frames: um pra o navegador aplicar a posição escondida sem
        // transição, outro pra religar as transições
        requestAnimationFrame(() => requestAnimationFrame(() => setEstado('idle')))
      }, REARMA_MS)
    )
  }

  return (
    <a
      href={links.github}
      target="_blank"
      rel="noreferrer"
      aria-label="GitHub"
      data-state={estado}
      onClick={onClick}
      className={`hoop pointer-events-auto ${className}`}
    >
      <span className="hoop-baloes" aria-hidden="true">
        {BALOES.map((b) => (
          <span
            key={b.cor}
            className="hoop-balao"
            style={{ '--x': b.x, '--lift': b.lift, '--fx': b.fx, '--r': b.r, '--d': b.d }}
          >
            <Balao cor={b.cor} />
          </span>
        ))}
      </span>
      <span className="hoop-foto">
        <img src="/img/hoop-balloons.webp" alt="" width={256} height={256} decoding="async" />
      </span>
    </a>
  )
}

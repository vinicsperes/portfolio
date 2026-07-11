export const pt = {
  hero: {
    tag: '> DEV CRIATIVO FULLSTACK',
    titleTop: 'Oi! Eu sou',
    titleBottom: 'o Vinícius',
    hint: 'explore o quarto: os objetos contam a história',
  },

  about: {
    titleTop: 'Sobre',
    titleBottom: 'Mim',
    headTop: 'A MÚSICA',
    headBottom: 'VEIO PRIMEIRO.',
    // TODO(vinicius): ajustar com a sua história real
    p1: 'O moleque do quadro sou eu, numa das primeiras vezes que subi num palco. A música chegou antes do código e nunca foi embora: é dela que vem o meu jeito de construir, de ouvido, no detalhe, repetindo até soar certo.',
    p2: 'Hoje sou dev fullstack e moro no espaço entre design e engenharia: produto e interface no dia a dia, áudio, 3D e terminal nas horas vagas. Se dá pra tocar, girar ou apertar, provavelmente saiu daqui.',
    cta: 'VAMOS CONVERSAR',
  },

  ghost: {
    tag: '> WEB AUDIO & 3D',
    title: 'GHOST',
    subtitle: 'UM PEDAL DE GUITARRA NO SEU NAVEGADOR',
    intro:
      'Plugue, pise para armar e esculpa seu timbre com drive, echo, modulação e reverb num pedal 3D em tempo real cujos knobs você realmente gira. Sem instalação, sem plugins, sem app nativo: toda a cadeia de sinal é construída à mão na Web Audio API.',
    scene: {
      hint: 'ROLE ↓',
    },
    features: {
      knobs: {
        title: 'Knobs de verdade',
        p: 'Modelados peça por peça a partir do hardware de referência, do knob ao circuito. No app, você gira cada um.',
      },
    },
    presets: {
      title: 'Seis presets com voz própria',
      short: 'Cada um é um pedal diferente por dentro, não uma posição de knob salva.',
      p: 'Cada preset é um pedal diferente por dentro, não uma posição de knob salva. Trocar de rig troca a topologia do drive, a voz do delay, o circuito de modulação, o gabinete e o reverb, e re-tematiza a interface inteira.',
      list: [
        { name: 'GHOST', desc: 'drive com médios empurrados que limpa no volume' },
        { name: 'DOOM', desc: 'muralha de fuzz afinado grave' },
        { name: 'FROST', desc: 'clean cristalino com chorus exuberante' },
        { name: 'HEAVY', desc: 'alto ganho scooped, seco' },
        { name: 'HAZE', desc: 'sistema climático shoegaze' },
        { name: 'FEVER', desc: 'fuzz com oitava acima' },
      ],
    },
    ready: {
      title: 'Bora?',
      play: 'TOCAR NO GHOSTFX.APP',
      source: 'CÓDIGO FONTE',
    },
  },

  verve: {
    tag: '> RUST · TUI',
    title: 'VERVE',
    p1: 'Um teste de velocidade de digitação minimalista que vive no seu terminal. Palavras aparecem, você digita, e cada caractere acende conforme você avança. Sua melhor corrida da sessão é registrada e celebrada com confete.',
    p2Prefix: 'Feito com Rust, ',
    p2Suffix: '. Um único binário auto-contido.',
    source: 'CÓDIGO FONTE',
    liveHint: 'A DIGITAÇÃO NO MONITOR É AO VIVO: É SÓ COMEÇAR',
    stats: { wpm: 'WPM', acc: 'PREC', time: 'TEMPO', best: 'RECORDE' },
    idle: {
      line1: 'um teste de digitação no seu terminal',
      cta: 'clique no computador para jogar_',
    },
  },

  contact: {
    titleTop: 'Diga',
    titleBottom: 'Olá',
    p: 'Tem um projeto, uma vaga, ou só quer trocar ideia? Minha caixa de entrada está aberta.',
    emailLabel: 'EMAIL',
    copy: 'COPIAR',
    copied: 'COPIADO ✓',
    links: { github: 'GITHUB', linkedin: 'LINKEDIN', cv: 'CURRÍCULO' },
  },

  blog: {
    title: 'Blog',
    soon: 'EM BREVE',
    soonSub:
      'Notas de bastidores sobre como esses projetos são feitos: Web Audio por dentro, 3D na web, Rust no terminal.',
  },

  projects: {
    title: 'O que eu construo',
    sub: 'Daqui pra baixo, os projetos. Cada um tem demo ao vivo, direto na página.',
  },

  sections: {
    about: 'SOBRE MIM',
    projects: 'PROJETOS',
    blog: 'BLOG',
    contact: 'CONTATO',
  },

  labels: {
    pc: '→ VERVE — DIGITE NO TERMINAL',
    painting: '→ SOBRE MIM',
    ghost: '→ GHOST FX — ABRA O PEDAL',
    phone: '→ CONTATO',
    shelf: '→ BLOG — EM BREVE',
  },

  ui: {
    backToRoom: '← VOLTAR AO QUARTO',
    openInScene: 'ABRIR NA CENA →',
    scrollHint: 'ROLE PARA EXPLORAR',
    footer: 'feito com React, Three.js e um CRT em chamas',
  },
}

export const pt = {
  hero: {
    tag: 'DEV CRIATIVO FULLSTACK',
    titleTop: 'Oi! Eu sou',
    titleBottom: 'o Vinícius',
    // faixa de selos sob o lockup (estilo carimbo de coleção)
    badge: {
      l1: 'VINICIUS PERES · SOFTWARE DEV',
      l2: 'SANTA CATARINA · BRASIL',
    },
    note: {
      l1: 'Ei! Curioso pra ver como foi feito?',
      l2: 'O site inteiro tá aberto no GitHub →',
    },
    welcome:
      'OI! SOU O VINÍCIUS, DESENVOLVEDOR DE SOFTWARE. AQUI FICAM MEUS TRABALHOS MAIS RECENTES: WEB AUDIO, 3D NA WEB E, PRINCIPALMENTE, COISAS QUE DÁ PRA BRINCAR. FIQUE À VONTADE!',
    // convite para trocar de idioma — escrito no OUTRO idioma, de propósito
    langCta: { label: 'oh no! I got lost!', flag: '🇺🇸', to: 'en' },
  },

  about: {
    titleTop: 'Sobre',
    titleBottom: 'Mim',
    headTop: 'DESENVOLVEDOR',
    headBottom: 'DE SOFTWARE.',
    p1: 'Prazer, sou o Vinícius, desenvolvedor de software. Moro em Santa Catarina, no Brasil, e passo os dias construindo produtos e interfaces para a web, do design à engenharia.',
    p2: 'Quando não estou programando, você provavelmente me acha numa quadra de basquete ou ouvindo música.',
    cta: 'VAMOS CONVERSAR',
  },

  ghost: {
    tag: '> WEB AUDIO & 3D',
    title: 'GHOST',
    subtitle: 'UM PEDAL DE GUITARRA NO SEU NAVEGADOR',
    intro:
      'Plugue, pise para armar e esculpa seu timbre com drive, echo, modulação e reverb num pedal 3D em tempo real cujos knobs você realmente gira. Sem instalação, sem plugins, sem app nativo: toda a cadeia de sinal é construída à mão na Web Audio API.',
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

  ui: {
    socials: 'REDES',
    backToRoom: '← VOLTAR',
    scrollHint: 'ROLE PARA EXPLORAR',
    footer: 'feito com React, Three.js e um CRT velho de guerra',
  },
}

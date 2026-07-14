export const en = {
  hero: {
    tag: 'FULLSTACK CREATIVE DEVELOPER',
    titleTop: "Hi! I'm",
    titleBottom: 'Vinícius',
    // faixa de selos sob o lockup (estilo carimbo de coleção)
    badge: {
      mono: 'VP',
      l1: 'VINICIUS PERES · SOFTWARE DEV',
      l2: 'SANTA CATARINA · BRAZIL',
    },
    note: {
      l1: "Hey! Curious about how it's built?",
      l2: 'The whole site is open on GitHub →',
    },
    welcome:
      "HI! I'M VINÍCIUS, A SOFTWARE DEVELOPER. THIS IS WHERE MY LATEST WORK LIVES: WEB AUDIO, 3D ON THE WEB AND, ABOVE ALL, THINGS YOU CAN PLAY WITH. MAKE YOURSELF AT HOME!",
    // convite para trocar de idioma — escrito no OUTRO idioma, de propósito
    langCta: { label: 'chega aí, meu parça', flag: '🇧🇷', to: 'pt' },
  },

  about: {
    titleTop: 'About',
    titleBottom: 'Me',
    headTop: 'SOFTWARE',
    headBottom: 'DEVELOPER.',
    p1: "Nice to meet you. I'm Vinícius, a software developer based in Santa Catarina, Brazil, and I spend my days building products and interfaces for the web, from design to engineering.",
    p2: "When I'm not coding, you'll probably find me on a basketball court or listening to music.",
    cta: "LET'S TALK",
  },

  ghost: {
    tag: '> WEB AUDIO & 3D',
    title: 'GHOST',
    subtitle: 'A GUITAR PEDAL IN YOUR BROWSER',
    intro:
      'Plug in, stomp to arm, and shape your tone with drive, echo, modulation and reverb on a real-time 3D pedal whose knobs you actually turn. No install, no plugins, no native app: the entire signal chain is hand-built on the Web Audio API.',
    features: {
      knobs: {
        title: 'Real knobs',
        p: 'Modeled piece by piece after the reference hardware, knob to circuit. In the app, you turn every one of them.',
      },
    },
    presets: {
      title: 'Six voiced presets',
      short: 'Each one is a different pedal inside, not a saved knob position.',
      p: 'Each preset is a different pedal inside, not a saved knob position. Switching rigs swaps the drive topology, the delay voice, the modulation circuit, the cabinet and the reverb, then re-themes the whole interface.',
      list: [
        { name: 'GHOST', desc: 'mid-pushed drive that cleans up' },
        { name: 'DOOM', desc: 'low-tuned fuzz wall' },
        { name: 'FROST', desc: 'glassy clean with lush chorus' },
        { name: 'HEAVY', desc: 'scooped high gain, tight' },
        { name: 'HAZE', desc: 'shoegaze weather system' },
        { name: 'FEVER', desc: 'octave-up fuzz' },
      ],
    },
    ready: {
      title: 'Ready?',
      play: 'PLAY ON GHOSTFX.APP',
      source: 'SOURCE CODE',
    },
  },

  verve: {
    tag: '> RUST · TUI',
    title: 'VERVE',
    p1: 'A minimalist typing speed test that lives in your terminal. Words appear, you type, and every character lights up as you go. Your best run of the session is tracked and celebrated with confetti.',
    p2Prefix: 'Built with Rust, ',
    p2Suffix: '. Single self-contained binary.',
    source: 'SOURCE CODE',
  },

  contact: {
    titleTop: 'Say',
    titleBottom: 'Hello',
    p: "Got a project, a job, or just want to talk shop? My inbox is open.",
    emailLabel: 'EMAIL',
    copy: 'COPY',
    copied: 'COPIED ✓',
    links: { github: 'GITHUB', linkedin: 'LINKEDIN', cv: 'RESUME' },
  },

  blog: {
    title: 'Blog',
    soon: 'COMING SOON',
    soonSub:
      'Field notes on how these projects are built: Web Audio internals, 3D on the web, Rust in the terminal.',
  },

  projects: {
    title: 'What I build',
    sub: 'From here down, the projects. Each one has a live demo, right on the page.',
  },

  sections: {
    about: 'ABOUT ME',
    projects: 'PROJECTS',
    blog: 'BLOG',
    contact: 'CONTACT',
  },

  ui: {
    backToRoom: '← BACK',
    scrollHint: 'SCROLL TO EXPLORE',
    footer: 'built with React, Three.js and an old CRT',
  },
}

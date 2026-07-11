export const en = {
  hero: {
    tag: '> FULLSTACK CREATIVE DEV',
    titleTop: "Hi! I'm",
    titleBottom: 'Vinícius',
    hint: 'explore the room: the objects tell the story',
  },

  about: {
    titleTop: 'About',
    titleBottom: 'Me',
    headTop: 'MUSIC',
    headBottom: 'CAME FIRST.',
    // TODO(vinicius): adjust with your real story
    p1: "The kid in the frame is me, one of the first times I ever got on a stage. Music came before code and never left: it's where my way of building comes from, by ear, detail by detail, repeating until it sounds right.",
    p2: "These days I'm a fullstack dev living between design and engineering: product and interfaces by day, audio, 3D and terminal experiments after hours. If you can play it, turn it or press it, odds are it came from here.",
    cta: "LET'S TALK",
  },

  ghost: {
    tag: '> WEB AUDIO & 3D',
    title: 'GHOST',
    subtitle: 'A GUITAR PEDAL IN YOUR BROWSER',
    intro:
      'Plug in, stomp to arm, and shape your tone with drive, echo, modulation and reverb on a real-time 3D pedal whose knobs you actually turn. No install, no plugins, no native app: the entire signal chain is hand-built on the Web Audio API.',
    scene: {
      hint: 'SCROLL ↓',
    },
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
    liveHint: 'TYPING IN THE MONITOR IS LIVE: JUST START',
    stats: { wpm: 'WPM', acc: 'ACC', time: 'TIME', best: 'BEST' },
    idle: {
      line1: 'a typing test in your terminal',
      cta: 'click the computer to play_',
    },
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

  labels: {
    pc: '→ VERVE — TYPE IN THE TERMINAL',
    painting: '→ ABOUT ME',
    ghost: '→ GHOST FX — OPEN THE PEDAL',
    phone: '→ CONTACT',
    shelf: '→ BLOG — COMING SOON',
  },

  ui: {
    backToRoom: '← BACK TO ROOM',
    openInScene: 'OPEN IN SCENE →',
    scrollHint: 'SCROLL TO EXPLORE',
    footer: 'built with React, Three.js and a burning CRT',
  },
}

export const en = {
  hero: {
    tag: '> FULLSTACK CREATIVE DEV',
    titleTop: "Hi! I'm",
    titleBottom: 'Vinícius',
    hint: 'explore the room — the objects tell the story',
  },

  about: {
    titleTop: 'About',
    titleBottom: 'Me',
    calloutTop: 'HEY! YOU CAN CALL ME',
    nickname: 'Vini',
    // TODO(vinicius): replace with your real bio
    p1: "I'm a fullstack creative developer who likes building things you can touch: a guitar pedal that lives in the browser, a typing test that lives in the terminal, a portfolio that lives inside a room.",
    p2: 'My favorite ground is the space between design and engineering — React, Three.js, WebGL and Web Audio on one side, Rust and systems curiosity on the other.',
    cta: "LET'S TALK",
  },

  ghost: {
    tag: '> WEB AUDIO & 3D',
    title: 'GHOST',
    subtitle: 'A GUITAR PEDAL IN YOUR BROWSER',
    intro:
      'Plug in, stomp to arm, and shape your tone with drive, echo, modulation and reverb on a real-time 3D pedal whose knobs you actually turn. No install, no plugins, no native app: the entire signal chain is hand-built on the Web Audio API.',
    scrollHint: 'SCROLL TO OPEN THE CHASSIS ↓',
    underHood: {
      title: 'Under the hood',
      p1: 'Under the translucent lid there is a full circuit board: DIP op amps, carbon resistors, electrolytics with real markings, a reverb brick — all laid out after an analog reference down to the silkscreen.',
      p2: 'As you scroll, the pedal on the floor opens up, revealing its internal components. Every piece is meticulously modeled and interactive.',
      badge: 'WEB AUDIO · 3D',
    },
    presets: {
      title: 'Six voiced presets',
      p: 'Each preset is a different pedal inside, not a saved knob position. Switching rigs swaps the drive topology, the delay voice, the modulation circuit, the cabinet and the reverb — then re-themes the whole interface.',
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
    liveHint: 'TYPING IN THE MONITOR IS LIVE — JUST START',
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
      'Field notes on how these projects are built — Web Audio internals, 3D on the web, Rust in the terminal.',
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
    switchToVerve: 'SWITCH TO VERVE →',
    switchToGhost: 'SWITCH TO GHOST →',
    openInScene: 'OPEN IN SCENE →',
    scrollHint: 'SCROLL TO EXPLORE',
    footer: 'built with React, Three.js and a burning CRT',
  },
}

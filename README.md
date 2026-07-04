# portfolio

Meu portfólio pessoal — feito com React, Three.js e Tailwind.

Um CRT antigo pegando fogo em 3D no topo, o pedal 3D do [Ghost](https://ghostfx.app)
e um preview do teste de digitação do Verve. Estética neo-brutalista, tudo renderizado
no navegador.

## Stack

- React + Vite
- Three.js via [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) e drei
- Tailwind CSS v4

## Rodando localmente

```sh
npm install
npm run dev
```

Build de produção:

```sh
npm run build
npm run preview
```

## Estrutura

- `src/components` — seções da página (hero, projetos, contato)
- `src/components/three` — cenas 3D (CRT em chamas, pedal, shaders de fogo/CRT)
- `public` — fontes, HDRI e imagens

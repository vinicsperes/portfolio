import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

export const noiseGLSL = /* glsl */ `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    // 4 oitavas: visualmente ~igual a 5, bem mais leve em iGPU
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }
`

/**
 * Tela CRT: tubo escuro quente, linhas de "código" fake, scanlines,
 * mancha laranja rolante, flicker e sangramento do fogo no topo.
 */
export const CRTMaterial = shaderMaterial(
  { uTime: 0, uMap: null, uHasMap: 0, uHeat: 1 },
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform sampler2D uMap;
    uniform float uHasMap;
    uniform float uHeat;
    varying vec2 vUv;

    ${noiseGLSL}

    void main() {
      // distorção de barril leve, coisa de tubo
      vec2 c = vUv - 0.5;
      vec2 uv = c * (1.0 + dot(c, c) * 0.45) + 0.5;

      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }

      // glitch horizontal: linhas inteiras pulam de vez em quando
      float rowSeed = floor(uv.y * 28.0);
      float glitch = step(0.96, hash(vec2(rowSeed, floor(uTime * 6.0))));
      uv.x = fract(uv.x + glitch * (hash(vec2(rowSeed, 1.0)) - 0.5) * 0.2);

      vec3 col = vec3(0.035, 0.02, 0.015);

      if (uHasMap > 0.5) {
        // We have a texture! Use it as the base color
        vec4 texColor = texture2D(uMap, uv);
        col = texColor.rgb;
      } else {
        // Fallback to green code matrix
        vec2 grid = vec2(floor(uv.x * 34.0), floor(uv.y * 22.0));
        float charOn = step(0.45, hash(grid + floor(uTime * 1.5) * 0.31));
        float lineOn = step(0.25, hash(vec2(grid.y, 7.0)));
        float text = charOn * lineOn * step(0.06, uv.x) * step(uv.x, 0.94);
        col += vec3(0.18, 1.0, 0.45) * text * 0.85;
      }

      // scanlines + mancha laranja rolante (cor do acento do verve, não verde)
      col *= 0.78 + 0.22 * sin(uv.y * 320.0);
      float band = smoothstep(0.0, 0.25, fract(uv.y - uTime * 0.12)) *
                   smoothstep(0.5, 0.25, fract(uv.y - uTime * 0.12));
      col += vec3(0.16, 0.06, 0.018) * band;

      // flicker global
      col *= 0.85 + 0.15 * hash(vec2(floor(uTime * 24.0), 3.0));

      // o fogo sangrando pelo topo da tela (uHeat acalma no close do verve)
      float heat = smoothstep(0.55, 1.0, uv.y) * (0.6 + 0.4 * fbm(vec2(uv.x * 5.0, uTime * 2.0)));
      col = mix(col, vec3(1.0, 0.45, 0.08), heat * 0.7 * uHeat);

      // vinheta
      float vig = 1.0 - dot(c, c) * 1.4;
      col *= vig;

      gl_FragColor = vec4(col, 1.0);
    }
  `
)

extend({ CrtMaterial: CRTMaterial })

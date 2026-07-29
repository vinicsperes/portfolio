import * as THREE from "three";
import { SILK } from "../constants";

/**
 * Silkscreen da placa, DESENHADO na textura em vez de virar geometria.
 *
 * Antes eram ~42 malhas só de serigrafia: 15 SilkRect (4 barrinhas cada), 6
 * SilkRing (torus), 19 SilkText (troika, com SDF e draw call próprios), o
 * fantasminha e o wordmark. Tudo isso vira pixel na textura que a placa já
 * carrega, e o custo por frame some.
 */

export type SilkRectSpec = { x: number; z: number; w: number; d: number; t?: number };
export type SilkRingSpec = { x: number; z: number; r: number };
export type SilkTextSpec = { x: number; z: number; text: string; size?: number; align?: "center" | "left" };

export type SilkPlan = {
  rects: SilkRectSpec[];
  rings: SilkRingSpec[];
  texts: SilkTextSpec[];
  ghost?: { x: number; z: number; size: number };
};

/**
 * Mapeia o plano da placa para o canvas da textura.
 *
 * O tampo da BoxGeometry tem u crescendo com +x e v crescendo com +z; a
 * CanvasTexture nasce com flipY, então v=1 é a PRIMEIRA linha do canvas. Ou
 * seja: +x vai pra direita e +z vai pra CIMA no canvas.
 *
 * Só o eixo VERTICAL inverte, então texto e fantasminha são desenhados com
 * scale(1,-1): o flipY da textura desfaz essa inversão e eles saem em pé. Um
 * rotate(180°) aqui seria errado — inverteria os dois eixos, e o flipY
 * cancelaria só um, deixando tudo espelhado na horizontal.
 */
export function paintSilk(
  ctx: CanvasRenderingContext2D,
  plan: SilkPlan,
  opts: { cw: number; ch: number; boardW: number; physL: number; zOffset: number }
) {
  const { cw, ch, boardW, physL, zOffset } = opts;
  const S = cw / boardW; // pixels por unidade de mundo (uniforme: ch = cw * physL/boardW)
  const px = (x: number) => (x + boardW / 2) * S;
  const py = (z: number) => ch - (z + zOffset + physL / 2) * S;

  ctx.save();
  ctx.strokeStyle = SILK;
  ctx.fillStyle = SILK;
  ctx.lineJoin = "miter";

  for (const r of plan.rects) {
    ctx.lineWidth = Math.max(1, (r.t ?? 0.0045) * S);
    ctx.strokeRect(px(r.x - r.w / 2), py(r.z + r.d / 2), r.w * S, r.d * S);
  }

  ctx.lineWidth = Math.max(1, 0.0044 * S);
  for (const r of plan.rings) {
    ctx.beginPath();
    ctx.arc(px(r.x), py(r.z), r.r * S, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const t of plan.texts) {
    const size = (t.size ?? 0.033) * S;
    ctx.save();
    ctx.translate(px(t.x), py(t.z));
    ctx.scale(1, -1); // ver nota de orientação acima
    ctx.font = `600 ${size}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.textAlign = t.align === "left" ? "left" : "center";
    ctx.textBaseline = "middle";
    ctx.fillText(t.text, 0, 0);
    ctx.restore();
  }

  if (plan.ghost) {
    const g = plan.ghost;
    const s = g.size * S;
    ctx.save();
    ctx.translate(px(g.x), py(g.z));
    ctx.scale(1, -1);
    ctx.translate(-s / 2, -s / 2);
    ctx.scale(s / 64, s / 64);
    const body = new Path2D(
      "M16 51 L16 28 C16 16 23 9 32 9 C41 9 48 16 48 28 L48 51 Q44 47 40 51 Q36 55 32 51 Q28 47 24 51 Q20 55 16 51 Z"
    );
    ctx.fillStyle = "#cbc6b4";
    ctx.fill(body);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(26, 28, 4.2, 0, Math.PI * 2);
    ctx.arc(38, 28, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/** Caixa alinhada aos eixos, já posicionada — pronta pra fundir. */
export function boxAt(w: number, h: number, d: number, x: number, y: number, z: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

/** Cilindro em pé, já posicionado. */
export function cylAt(r: number, h: number, seg: number, x: number, y: number, z: number) {
  const g = new THREE.CylinderGeometry(r, r, h, seg);
  g.translate(x, y, z);
  return g;
}

/** Esfera, já posicionada. */
export function sphereAt(r: number, wSeg: number, hSeg: number, x: number, y: number, z: number) {
  const g = new THREE.SphereGeometry(r, wSeg, hSeg);
  g.translate(x, y, z);
  return g;
}

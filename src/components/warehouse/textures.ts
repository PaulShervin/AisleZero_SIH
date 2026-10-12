import * as THREE from "three";
import { makeRng } from "./rng";

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return { c, ctx: c.getContext("2d")! };
}

function finish(c: HTMLCanvasElement, repeat?: [number, number]) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  tex.anisotropy = 8;
  return tex;
}

/** Polished grey concrete: fine speckle, faint trowel blotches, saw-cut joints. */
export function makeConcreteTexture() {
  const size = 512;
  const { c, ctx } = canvas(size);
  const rnd = makeRng(11);
  ctx.fillStyle = "#8d9095";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 26000; i++) {
    const v = 120 + rnd() * 60;
    ctx.fillStyle = `rgba(${v},${v},${v + 3},${0.04 + rnd() * 0.16})`;
    ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  for (let i = 0; i < 40; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = 30 + rnd() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = rnd() > 0.5;
    g.addColorStop(0, dark ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(60,62,66,0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);
  return finish(c, [12, 9]);
}

/** Dark-grey corrugated steel cladding. */
export function makeWallTexture() {
  const size = 256;
  const { c, ctx } = canvas(size);
  ctx.fillStyle = "#4a5058";
  ctx.fillRect(0, 0, size, size);
  for (let x = 0; x < size; x += 16) {
    const g = ctx.createLinearGradient(x, 0, x + 16, 0);
    g.addColorStop(0, "rgba(255,255,255,0.16)");
    g.addColorStop(0.45, "rgba(0,0,0,0.18)");
    g.addColorStop(0.55, "rgba(0,0,0,0.22)");
    g.addColorStop(1, "rgba(255,255,255,0.08)");
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 16, size);
  }
  // panel seam
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, size / 2 - 1, size, 2);
  return finish(c, [16, 4]);
}

/** Kraft cardboard with a tape seam and a shipping label. */
export function makeCartonTexture() {
  const size = 128;
  const { c, ctx } = canvas(size);
  const rnd = makeRng(23);
  ctx.fillStyle = "#b9894b";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 3500; i++) {
    const v = 150 + rnd() * 60;
    ctx.fillStyle = `rgba(${v},${v * 0.74},${v * 0.46},0.22)`;
    ctx.fillRect(rnd() * size, rnd() * size, 2, 2);
  }
  // flute lines
  ctx.fillStyle = "rgba(80,55,25,0.08)";
  for (let y = 0; y < size; y += 4) ctx.fillRect(0, y, size, 1);
  // tape
  ctx.fillStyle = "rgba(222,214,192,0.9)";
  ctx.fillRect(size / 2 - 5, 0, 10, size);
  // label
  ctx.fillStyle = "#f1efe8";
  ctx.fillRect(14, 70, 40, 26);
  ctx.fillStyle = "#1b1b1b";
  for (let i = 0; i < 9; i++) ctx.fillRect(17 + i * 4, 74, i % 3 === 0 ? 2 : 1, 12);
  ctx.fillRect(17, 90, 30, 2);
  // edges
  ctx.strokeStyle = "rgba(70,45,20,0.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, size, size);
  return finish(c);
}

/** Wooden pallet planks. */
export function makePalletTexture() {
  const size = 128;
  const { c, ctx } = canvas(size);
  const rnd = makeRng(41);
  ctx.fillStyle = "#9c7a4e";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2500; i++) {
    const v = 120 + rnd() * 70;
    ctx.fillStyle = `rgba(${v},${v * 0.78},${v * 0.5},0.25)`;
    ctx.fillRect(rnd() * size, rnd() * size, 3, 1);
  }
  ctx.fillStyle = "rgba(40,28,14,0.7)";
  for (const y of [0, 42, 84]) ctx.fillRect(0, y, size, 3);
  return finish(c);
}

/** Sectional roller door: horizontal panels with shadow lines. */
export function makeDoorTexture() {
  const size = 256;
  const { c, ctx } = canvas(size);
  ctx.fillStyle = "#5b6168";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 32) {
    const g = ctx.createLinearGradient(0, y, 0, y + 32);
    g.addColorStop(0, "rgba(255,255,255,0.14)");
    g.addColorStop(0.8, "rgba(0,0,0,0.05)");
    g.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y, size, 32);
  }
  return finish(c);
}

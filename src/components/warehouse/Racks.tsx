import { useMemo } from "react";
import { CELL, RACK_RUNS, gridToWorld } from "@/sim/grid";
import { Instanced, type InstanceItem } from "./Instanced";
import { makeCartonTexture, makePalletTexture } from "./textures";
import { makeRng } from "./rng";
import { COLOR } from "./layout";

/** Selective pallet racking: two back-to-back rows per 4 m rack footprint. */
const ROW_OFFSETS = [-1.0, 1.0]; // x offset of each row centre inside the footprint
const ROW_DEPTH = 1.1; // front-to-back distance between a row's uprights
const UPRIGHT_H = 5.6;
const BEAM_LEVELS = [1.55, 3.0, 4.45]; // top of beam; pallets sit on these
const BAY = 2.8; // frame spacing along the run
const PALLET: [number, number, number] = [1.0, 0.14, 1.2];
const OCCUPANCY = 0.8;

const CARTON_TINTS = ["#ffffff", "#f3e6d2", "#e9d4b8", "#d9c3a5", "#fff4e4", "#cdb79b"];

interface RackItems {
  uprights: InstanceItem[];
  beams: InstanceItem[];
  braces: InstanceItem[];
  feet: InstanceItem[];
  pallets: InstanceItem[];
  cartons: InstanceItem[];
}

function addCartons(out: InstanceItem[], rnd: () => number, cx: number, y0: number, cz: number) {
  const pattern = rnd();
  const tint = () => CARTON_TINTS[Math.floor(rnd() * CARTON_TINTS.length)]!;
  if (pattern < 0.35) {
    // one large case
    const h = 0.7 + rnd() * 0.5;
    out.push({ p: [cx, y0 + h / 2, cz], s: [0.92, h, 1.1], c: tint() });
    return;
  }
  if (pattern < 0.75) {
    // 2 x 2 cartons, maybe two layers
    const layers = rnd() > 0.5 ? 2 : 1;
    const h = 0.42 + rnd() * 0.2;
    for (let l = 0; l < layers; l++) {
      for (const dx of [-0.24, 0.24]) {
        for (const dz of [-0.29, 0.29]) {
          if (rnd() < 0.08) continue;
          out.push({
            p: [cx + dx, y0 + h / 2 + l * (h + 0.01), cz + dz],
            s: [0.44, h, 0.54],
            r: [0, (rnd() - 0.5) * 0.06, 0],
            c: tint(),
          });
        }
      }
    }
    return;
  }
  // three slim cartons side by side
  const h = 0.6 + rnd() * 0.4;
  for (const dz of [-0.37, 0, 0.37]) {
    out.push({ p: [cx, y0 + h / 2, cz + dz], s: [0.9, h, 0.34], c: tint() });
  }
}

function buildRacks(): RackItems {
  const rnd = makeRng(7);
  const out: RackItems = {
    uprights: [],
    beams: [],
    braces: [],
    feet: [],
    pallets: [],
    cartons: [],
  };
  const braceLen = Math.hypot(ROW_DEPTH, 1.3);
  const braceAngle = Math.atan2(1.3, ROW_DEPTH);

  for (const run of RACK_RUNS) {
    const [x0, z0] = gridToWorld(run.x, run.z0);
    const [, z1] = gridToWorld(run.x, run.z1);
    const cx = x0 + CELL / 2;
    const zStart = z0 - CELL / 2;
    const zEnd = z1 + CELL / 2;
    const length = zEnd - zStart;
    const bays = Math.round(length / BAY);

    for (const ro of ROW_OFFSETS) {
      const rowX = cx + ro;
      const frontX = rowX - ROW_DEPTH / 2;
      const backX = rowX + ROW_DEPTH / 2;

      // frames
      for (let f = 0; f <= bays; f++) {
        const z = zStart + f * BAY;
        for (const fx of [frontX, backX]) {
          out.uprights.push({ p: [fx, UPRIGHT_H / 2, z], s: [0.1, UPRIGHT_H, 0.1] });
          out.feet.push({ p: [fx, 0.04, z], s: [0.18, 0.08, 0.24] });
        }
        // horizontal ties and diagonals between front and back upright
        for (let y = 0.5; y < UPRIGHT_H - 0.6; y += 1.3) {
          out.braces.push({ p: [rowX, y, z], s: [ROW_DEPTH, 0.05, 0.05] });
          const up = Math.floor(y / 1.3) % 2 === 0;
          out.braces.push({
            p: [rowX, y + 0.65, z],
            s: [braceLen, 0.04, 0.04],
            r: [0, 0, up ? braceAngle : -braceAngle],
          });
        }
      }

      // beams along the run at each level, front and back
      for (const level of BEAM_LEVELS) {
        for (const bx of [frontX, backX]) {
          out.beams.push({ p: [bx, level - 0.06, (zStart + zEnd) / 2], s: [0.08, 0.12, length] });
        }
      }

      // pallets and cartons per bay per level (plus floor level)
      for (let b = 0; b < bays; b++) {
        const cz = zStart + BAY * (b + 0.5);
        for (const level of [0, ...BEAM_LEVELS]) {
          if (rnd() > OCCUPANCY) continue;
          const py = level + PALLET[1] / 2;
          out.pallets.push({ p: [rowX, py, cz], s: PALLET });
          addCartons(out.cartons, rnd, rowX, level + PALLET[1], cz);
        }
      }
    }
  }
  return out;
}

export function Racks() {
  const items = useMemo(buildRacks, []);
  const cartonTex = useMemo(makeCartonTexture, []);
  const palletTex = useMemo(makePalletTexture, []);

  return (
    <group>
      <Instanced items={items.uprights} color={COLOR.upright} roughness={0.45} metalness={0.5}>
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
      <Instanced
        items={items.feet}
        color="#1a2d55"
        roughness={0.6}
        metalness={0.4}
        castShadow={false}
      >
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
      <Instanced
        items={items.braces}
        color={COLOR.upright}
        roughness={0.5}
        metalness={0.5}
        castShadow={false}
      >
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
      <Instanced items={items.beams} color={COLOR.beam} roughness={0.4} metalness={0.45}>
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
      <Instanced items={items.pallets} map={palletTex} roughness={0.9}>
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
      <Instanced items={items.cartons} map={cartonTex} roughness={0.92}>
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
    </group>
  );
}

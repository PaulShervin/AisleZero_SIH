import { useMemo } from "react";
import { CELL, CHARGERS, DROPOFFS, GRID_H, PICKUPS, RACK_RUNS, gridToWorld } from "@/sim/grid";
import { Instanced, type InstanceItem } from "./Instanced";
import { COLOR, GRID_HALF_D, GRID_HALF_W } from "./layout";

const LINE = 0.12;
const Y = 0.012;

function rect(out: InstanceItem[], cx: number, cz: number, w: number, d: number) {
  out.push({ p: [cx, Y, cz - d / 2], s: [w, 0.01, LINE] });
  out.push({ p: [cx, Y, cz + d / 2], s: [w, 0.01, LINE] });
  out.push({ p: [cx - w / 2, Y, cz], s: [LINE, 0.01, d] });
  out.push({ p: [cx + w / 2, Y, cz], s: [LINE, 0.01, d] });
}

function dashedLine(out: InstanceItem[], x0: number, z0: number, x1: number, z1: number) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const n = Math.floor(len / 1.2);
  const horizontal = Math.abs(x1 - x0) > Math.abs(z1 - z0);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    out.push({
      p: [x0 + (x1 - x0) * t, Y, z0 + (z1 - z0) * t],
      s: horizontal ? [0.7, 0.01, LINE] : [LINE, 0.01, 0.7],
    });
  }
}

function buildMarkings() {
  const yellow: InstanceItem[] = [];
  const white: InstanceItem[] = [];

  // rack footprints
  for (const run of RACK_RUNS) {
    const [x0, z0] = gridToWorld(run.x, run.z0);
    const [, z1] = gridToWorld(run.x, run.z1);
    rect(yellow, x0 + CELL / 2, (z0 + z1) / 2, CELL * 2 + 0.3, z1 - z0 + CELL + 0.3);
  }

  // cross aisle edges (row y = 10 is the cross aisle)
  const [, crossZ] = gridToWorld(0, 10);
  for (const dz of [-CELL / 2, CELL / 2]) {
    dashedLine(yellow, -GRID_HALF_W + CELL, crossZ + dz, GRID_HALF_W - CELL, crossZ + dz);
  }

  // perimeter travel lane around the drivable area
  rect(yellow, 0, 0, GRID_HALF_W * 2 - 0.4, GRID_HALF_D * 2 - 0.4);

  // station boxes
  for (const c of [...PICKUPS, ...DROPOFFS]) {
    const [x, z] = gridToWorld(c.x, c.y);
    rect(white, x, z, CELL * 0.98, CELL * 0.98);
  }
  // charging bays: hatched box
  for (const c of CHARGERS) {
    const [x, z] = gridToWorld(c.x, c.y);
    rect(yellow, x, z, CELL * 0.98, CELL * 0.98);
    for (let i = -0.6; i <= 0.6; i += 0.4) {
      yellow.push({ p: [x + i, Y, z], s: [LINE, 0.01, CELL * 0.9], r: [0, Math.PI / 4, 0] });
    }
  }

  // pedestrian walkway along the bottom row (start row), white dashed
  const [, walkZ] = gridToWorld(0, GRID_H - 1);
  dashedLine(
    white,
    -GRID_HALF_W + CELL,
    walkZ + CELL / 2 - 0.2,
    GRID_HALF_W - CELL,
    walkZ + CELL / 2 - 0.2,
  );

  return { yellow, white };
}

export function FloorMarkings() {
  const m = useMemo(buildMarkings, []);
  return (
    <group>
      <Instanced
        items={m.yellow}
        color={COLOR.marking}
        roughness={0.85}
        castShadow={false}
        receiveShadow={false}
      >
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
      <Instanced
        items={m.white}
        color="#e8e9ea"
        roughness={0.85}
        castShadow={false}
        receiveShadow={false}
      >
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
    </group>
  );
}

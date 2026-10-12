import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CELL, GRID_H, GRID_W, gridToWorld, isRack, key } from "@/sim/grid";
import { useSimStore } from "@/sim/store";

const COLD = new THREE.Color("#1d4ed8");
const WARM = new THREE.Color("#f59e0b");
const HOT = new THREE.Color("#ef4444");

function heatColor(t: number, out: THREE.Color) {
  if (t < 0.5) return out.copy(COLD).lerp(WARM, t * 2);
  return out.copy(WARM).lerp(HOT, (t - 0.5) * 2);
}

/** Floor tint per aisle cell, scaled by how often robots have driven through it. */
export function HeatMap() {
  const show = useSimStore((s) => s.showHeat);
  const heat = useSimStore((s) => s.snap.heat);
  const ref = useRef<THREE.InstancedMesh>(null);

  const cells = useMemo(() => {
    const out: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        if (!isRack(x, y)) out.push({ x, y });
      }
    }
    return out;
  }, []);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const d = new THREE.Object3D();
    cells.forEach((c, i) => {
      const [wx, wz] = gridToWorld(c.x, c.y);
      d.position.set(wx, 0.035, wz);
      d.rotation.set(-Math.PI / 2, 0, 0);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [cells]);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh || !show) return;
    const max = Math.max(1, ...Object.values(heat));
    const color = new THREE.Color();
    const d = new THREE.Object3D();
    cells.forEach((c, i) => {
      const v = heat[key(c.x, c.y)] ?? 0;
      const [wx, wz] = gridToWorld(c.x, c.y);
      d.position.set(wx, 0.035, wz);
      d.rotation.set(-Math.PI / 2, 0, 0);
      d.scale.setScalar(v === 0 ? 0 : 1);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
      mesh.setColorAt(i, heatColor(Math.sqrt(v / max), color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [cells, heat, show]);

  if (!show) return null;

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cells.length]} frustumCulled={false}>
      <planeGeometry args={[CELL * 0.92, CELL * 0.92]} />
      <meshBasicMaterial transparent opacity={0.7} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
}

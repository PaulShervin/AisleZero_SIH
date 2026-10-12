import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getSim } from "@/sim/engine";
import { amrColor } from "@/sim/palette";
import { CELL, GRID_H, GRID_W } from "@/sim/grid";

const LINE_Y = 0.6;

function toWorld(x: number, y: number): [number, number] {
  return [(x - (GRID_W - 1) / 2) * CELL, (y - (GRID_H - 1) / 2) * CELL];
}

/** Dashed line from a waiting AMR to the AMR it is waiting for. */
function YieldLink({ index }: { index: number }) {
  const ref = useRef<THREE.Line>(null);
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    const material = new THREE.LineDashedMaterial({
      color: amrColor(index),
      dashSize: 0.4,
      gapSize: 0.25,
      transparent: true,
      opacity: 0.9,
    });
    const obj = new THREE.Line(geometry, material);
    obj.visible = false;
    return obj;
  }, [index]);

  useFrame(() => {
    const sim = getSim();
    const r = sim.robots[index];
    const obj = ref.current;
    if (!r || !obj) return;
    const snapRobot = r;
    const holdingId = snapRobot.holdingFor;
    const other = holdingId ? sim.robots.find((o) => o.id === holdingId) : null;
    if (!other) {
      obj.visible = false;
      return;
    }
    const [ax, az] = toWorld(r.pos.x, r.pos.y);
    const [bx, bz] = toWorld(other.pos.x, other.pos.y);
    const pos = obj.geometry.getAttribute("position") as THREE.BufferAttribute;
    pos.setXYZ(0, ax, LINE_Y, az);
    pos.setXYZ(1, bx, LINE_Y, bz);
    pos.needsUpdate = true;
    obj.computeLineDistances();
    obj.visible = true;
  });

  return <primitive object={line} ref={ref} />;
}

export function YieldLinks({ count }: { count: number }) {
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => (
        <YieldLink key={i} index={i} />
      ))}
    </group>
  );
}

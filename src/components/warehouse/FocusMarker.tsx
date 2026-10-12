import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { gridToWorld } from "@/sim/grid";
import { useSimStore } from "@/sim/store";
import { prefersReducedMotion } from "@/lib/motion";

const LIFETIME_MS = 4500;

/** Fading ring and label at the cell the user jumped to from the activity log. */
export function FocusMarker() {
  const focus = useSimStore((s) => s.focus);
  const ring = useRef<THREE.Mesh>(null);
  const reduced = useRef(prefersReducedMotion());

  useFrame(() => {
    const m = ring.current;
    if (!m || !focus) return;
    const age = (Date.now() - focus.at) / LIFETIME_MS;
    if (age >= 1) {
      m.visible = false;
      return;
    }
    m.visible = true;
    const pulse = reduced.current ? 1 : 1 + Math.sin(age * Math.PI * 6) * 0.08;
    m.scale.setScalar(pulse * (1 + age * 0.4));
    (m.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - age);
  });

  if (!focus) return null;
  const [x, z] = gridToWorld(focus.cell.x, focus.cell.y);
  const expired = Date.now() - focus.at >= LIFETIME_MS;
  if (expired) return null;

  return (
    <group position={[x, 0, z]}>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.08}>
        <ringGeometry args={[1.3, 1.6, 40]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} depthWrite={false} />
      </mesh>
      <Html position={[0, 2.9, 0]} center style={{ pointerEvents: "none" }}>
        <div className="max-w-[260px] whitespace-normal rounded-md border border-white/60 bg-[#10141b]/95 px-2 py-1 text-center font-mono text-[10px] text-white shadow-xl">
          {focus.label}
        </div>
      </Html>
    </group>
  );
}

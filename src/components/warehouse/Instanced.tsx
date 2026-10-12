import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";

export interface InstanceItem {
  /** Position. */
  p: [number, number, number];
  /** Scale (defaults to 1,1,1). */
  s?: [number, number, number];
  /** Euler rotation in radians. */
  r?: [number, number, number];
  /** Optional per-instance colour tint. */
  c?: string;
}

interface InstancedProps {
  items: InstanceItem[];
  /** The geometry element, e.g. <boxGeometry args={[1, 1, 1]} />. */
  children: ReactNode;
  color?: string;
  map?: THREE.Texture | null;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  transparent?: boolean;
  opacity?: number;
}

/** One draw call for many copies of the same geometry. Items are static after mount. */
export function Instanced({
  items,
  children,
  color = "#ffffff",
  map = null,
  roughness = 0.7,
  metalness = 0,
  emissive,
  emissiveIntensity = 0,
  castShadow = true,
  receiveShadow = true,
  transparent = false,
  opacity = 1,
}: InstancedProps) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const hasColors = useMemo(() => items.some((it) => it.c !== undefined), [items]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    items.forEach((it, i) => {
      d.position.set(...it.p);
      d.scale.set(...(it.s ?? [1, 1, 1]));
      d.rotation.set(...(it.r ?? [0, 0, 0]));
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
      if (hasColors) mesh.setColorAt(i, col.set(it.c ?? "#ffffff"));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, hasColors]);

  if (items.length === 0) return null;

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={false}
    >
      {children}
      <meshStandardMaterial
        color={color}
        map={map}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive ?? "#000000"}
        emissiveIntensity={emissiveIntensity}
        transparent={transparent}
        opacity={opacity}
      />
    </instancedMesh>
  );
}

import { useMemo } from "react";
import * as THREE from "three";
import { Instanced, type InstanceItem } from "./Instanced";
import { makeConcreteTexture, makeDoorTexture, makeWallTexture } from "./textures";
import { BUILDING_D, BUILDING_H, BUILDING_W, COLOR } from "./layout";

const COLUMN_SPACING = 8.75;
const TRUSS_SPACING = 8.5;
const LIGHT_ROWS_X = [-24, -16, -8, 0, 8, 16, 24];
const LIGHT_COLS_Z = [-16, -8, 0, 8, 16];

interface StructureItems {
  columns: InstanceItem[];
  chords: InstanceItem[];
  webs: InstanceItem[];
  purlins: InstanceItem[];
  housings: InstanceItem[];
  lenses: InstanceItem[];
  cables: InstanceItem[];
}

function buildStructure(): StructureItems {
  const w = BUILDING_W;
  const d = BUILDING_D;
  const h = BUILDING_H;
  const out: StructureItems = {
    columns: [],
    chords: [],
    webs: [],
    purlins: [],
    housings: [],
    lenses: [],
    cables: [],
  };

  // wall columns
  const nx = Math.round(w / COLUMN_SPACING);
  for (let i = 0; i <= nx; i++) {
    const x = -w / 2 + (i * w) / nx;
    for (const z of [-d / 2 + 0.3, d / 2 - 0.3]) {
      out.columns.push({ p: [x, h / 2, z], s: [0.45, h, 0.45] });
    }
  }
  const nz = Math.round(d / COLUMN_SPACING);
  for (let i = 1; i < nz; i++) {
    const z = -d / 2 + (i * d) / nz;
    for (const x of [-w / 2 + 0.3, w / 2 - 0.3]) {
      out.columns.push({ p: [x, h / 2, z], s: [0.45, h, 0.45] });
    }
  }

  // roof trusses spanning the width
  const trussCount = Math.round(d / TRUSS_SPACING);
  const depth = 1.6;
  const webLen = Math.hypot(2.2, depth);
  const webAngle = Math.atan2(depth, 2.2);
  for (let i = 0; i <= trussCount; i++) {
    const z = -d / 2 + (i * d) / trussCount;
    out.chords.push({ p: [0, h - 0.4, z], s: [w - 0.6, 0.22, 0.2] });
    out.chords.push({ p: [0, h - 0.4 - depth, z], s: [w - 0.6, 0.16, 0.16] });
    for (let x = -w / 2 + 2.2; x < w / 2 - 1; x += 2.2) {
      out.webs.push({ p: [x, h - 0.4 - depth / 2, z], s: [0.1, depth, 0.1] });
      const up = Math.round((x + w / 2) / 2.2) % 2 === 0;
      out.webs.push({
        p: [x + 1.1, h - 0.4 - depth / 2, z],
        s: [webLen, 0.08, 0.08],
        r: [0, 0, up ? webAngle : -webAngle],
      });
    }
  }
  // purlins along the depth
  for (let x = -w / 2 + 3; x < w / 2; x += 6) {
    out.purlins.push({ p: [x, h - 0.15, 0], s: [0.16, 0.2, d - 0.6] });
  }

  // high-bay fixtures
  for (const x of LIGHT_ROWS_X) {
    for (const z of LIGHT_COLS_Z) {
      const y = h - 0.4 - depth - 0.9;
      out.cables.push({ p: [x, y + 0.55, z], s: [0.03, 0.9, 0.03] });
      out.housings.push({ p: [x, y, z], s: [1.1, 0.22, 0.55] });
      out.lenses.push({ p: [x, y - 0.13, z], s: [1.0, 0.04, 0.45] });
    }
  }
  return out;
}

function Walls() {
  const wallTex = useMemo(makeWallTexture, []);
  const w = BUILDING_W;
  const d = BUILDING_D;
  const h = BUILDING_H;
  const walls = [
    { p: [0, h / 2, -d / 2] as [number, number, number], r: 0, len: w },
    { p: [0, h / 2, d / 2] as [number, number, number], r: Math.PI, len: w },
    { p: [-w / 2, h / 2, 0] as [number, number, number], r: Math.PI / 2, len: d },
    { p: [w / 2, h / 2, 0] as [number, number, number], r: -Math.PI / 2, len: d },
  ];
  return (
    <group>
      {/* Walls face inward only, so the camera outside sees straight in. */}
      {walls.map((wall, i) => (
        <mesh key={i} position={wall.p} rotation-y={wall.r} receiveShadow>
          <planeGeometry args={[wall.len, h]} />
          <meshStandardMaterial
            map={wallTex}
            color="#9aa0a8"
            side={THREE.FrontSide}
            roughness={0.75}
            metalness={0.25}
          />
        </mesh>
      ))}
      {/* concrete plinth */}
      {walls.map((wall, i) => (
        <mesh
          key={`plinth-${i}`}
          position={[wall.p[0], 0.6, wall.p[2]]}
          rotation-y={wall.r}
          receiveShadow
        >
          <boxGeometry args={[wall.len, 1.2, 0.3]} />
          <meshStandardMaterial color={COLOR.concreteTrim} roughness={0.9} />
        </mesh>
      ))}
      {/* roof, visible only from inside */}
      <mesh position={[0, h, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#262b33" side={THREE.FrontSide} roughness={0.95} />
      </mesh>
    </group>
  );
}

/** Sectional dock doors on the receiving (west) and shipping (east) walls. */
function DockDoors() {
  const doorTex = useMemo(makeDoorTexture, []);
  const w = BUILDING_W;
  const doors: Array<{ x: number; z: number; r: number }> = [
    { x: -w / 2 + 0.2, z: -8, r: Math.PI / 2 },
    { x: -w / 2 + 0.2, z: 0, r: Math.PI / 2 },
    { x: -w / 2 + 0.2, z: 8, r: Math.PI / 2 },
    { x: w / 2 - 0.2, z: -8, r: -Math.PI / 2 },
    { x: w / 2 - 0.2, z: 8, r: -Math.PI / 2 },
  ];
  return (
    <group>
      {doors.map((dr, i) => (
        <group key={i} position={[dr.x, 0, dr.z]} rotation-y={dr.r}>
          <mesh position={[0, 2.4, 0]}>
            <planeGeometry args={[4.2, 4.6]} />
            <meshStandardMaterial map={doorTex} roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh position={[0, 4.85, 0.05]}>
            <boxGeometry args={[4.6, 0.3, 0.2]} />
            <meshStandardMaterial color={COLOR.steelDark} metalness={0.6} roughness={0.4} />
          </mesh>
          {[-2.25, 2.25].map((ox) => (
            <mesh key={ox} position={[ox, 2.4, 0.05]}>
              <boxGeometry args={[0.2, 4.8, 0.2]} />
              <meshStandardMaterial color={COLOR.steelDark} metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
          {/* dock bumpers */}
          {[-1.6, 1.6].map((ox) => (
            <mesh key={`b${ox}`} position={[ox, 0.45, 0.2]} castShadow>
              <boxGeometry args={[0.5, 0.5, 0.3]} />
              <meshStandardMaterial color="#141618" roughness={0.95} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function Building() {
  const floorTex = useMemo(makeConcreteTexture, []);
  const s = useMemo(buildStructure, []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[BUILDING_W, BUILDING_D]} />
        <meshStandardMaterial
          map={floorTex}
          roughness={0.42}
          metalness={0.08}
          color="#b6b9be"
          envMapIntensity={0.6}
        />
      </mesh>
      <Walls />
      <DockDoors />
      <Instanced items={s.columns} color={COLOR.steelDark} roughness={0.5} metalness={0.6}>
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
      <Instanced
        items={s.chords}
        color={COLOR.steel}
        roughness={0.5}
        metalness={0.6}
        castShadow={false}
      >
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
      <Instanced
        items={s.webs}
        color={COLOR.steel}
        roughness={0.5}
        metalness={0.6}
        castShadow={false}
      >
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
      <Instanced
        items={s.purlins}
        color={COLOR.steelDark}
        roughness={0.5}
        metalness={0.6}
        castShadow={false}
      >
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
      <Instanced
        items={s.cables}
        color="#1d2024"
        metalness={0.8}
        roughness={0.3}
        castShadow={false}
      >
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
      <Instanced
        items={s.housings}
        color="#2b323c"
        metalness={0.7}
        roughness={0.35}
        castShadow={false}
      >
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
      <Instanced
        items={s.lenses}
        color="#fff7e6"
        emissive="#ffefc8"
        emissiveIntensity={2.2}
        castShadow={false}
        receiveShadow={false}
      >
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
    </group>
  );
}

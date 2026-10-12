import { useMemo } from "react";
import { Text } from "@react-three/drei";
import { CELL, CHARGERS, DROPOFFS, PICKUPS, RACK_XS, gridToWorld } from "@/sim/grid";
import { Instanced, type InstanceItem } from "./Instanced";
import { makeCartonTexture, makePalletTexture } from "./textures";
import { makeRng } from "./rng";
import { BUILDING_W, COLOR, GRID_HALF_D, GRID_HALF_W, MARGIN_X, MARGIN_Z } from "./layout";

const STEEL = "#3f4855";

/** Painted pickup / drop-off bay on the drivable cell the engine routes to. */
function Station({
  cell,
  label,
  color,
}: {
  cell: { x: number; y: number };
  label: string;
  color: string;
}) {
  const [x, z] = gridToWorld(cell.x, cell.y);
  return (
    <group position={[x, 0, z]}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.008} receiveShadow>
        <planeGeometry args={[CELL * 0.9, CELL * 0.9]} />
        <meshStandardMaterial color={color} roughness={0.7} transparent opacity={0.55} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.01}>
        <ringGeometry args={[CELL * 0.3, CELL * 0.36, 32]} />
        <meshStandardMaterial color="#12161c" />
      </mesh>
      <Text
        position={[0, 0.03, CELL * 0.33]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.34}
        color="#101418"
        anchorX="center"
      >
        {label}
      </Text>
    </group>
  );
}

/**
 * Roller conveyors feeding each bay from the dock wall. They sit entirely in the
 * margin band outside the navigation grid, so robots never drive over them.
 */
function Conveyors() {
  const items = useMemo(() => {
    const rails: InstanceItem[] = [];
    const legs: InstanceItem[] = [];
    const rollers: InstanceItem[] = [];
    const length = MARGIN_X - 0.9;
    const stations = [
      ...PICKUPS.map((c) => ({ c, side: -1 })),
      ...DROPOFFS.map((c) => ({ c, side: 1 })),
    ];
    for (const { c, side } of stations) {
      const [, z] = gridToWorld(c.x, c.y);
      const cx = side * (GRID_HALF_W + 0.5 + length / 2);
      for (const oz of [-0.62, 0.62]) {
        rails.push({ p: [cx, 0.52, z + oz], s: [length, 0.12, 0.08] });
      }
      for (const ox of [-length / 2 + 0.3, 0, length / 2 - 0.3]) {
        for (const oz of [-0.55, 0.55]) {
          legs.push({ p: [cx + ox, 0.23, z + oz], s: [0.08, 0.46, 0.08] });
        }
      }
      const n = Math.floor(length / 0.3);
      for (let i = 0; i < n; i++) {
        rollers.push({
          p: [cx - length / 2 + 0.15 + i * 0.3, 0.54, z],
          s: [0.09, 1.2, 0.09],
          r: [Math.PI / 2, 0, 0],
        });
      }
    }
    return { rails, legs, rollers };
  }, []);
  return (
    <group>
      <Instanced items={items.rails} color={STEEL} metalness={0.6} roughness={0.4}>
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
      <Instanced
        items={items.legs}
        color="#20262f"
        metalness={0.5}
        roughness={0.5}
        castShadow={false}
      >
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
      <Instanced
        items={items.rollers}
        color="#8d96a2"
        metalness={0.8}
        roughness={0.3}
        castShadow={false}
      >
        <cylinderGeometry args={[1, 1, 1, 10]} />
      </Instanced>
    </group>
  );
}

function Charger({ cell, label }: { cell: { x: number; y: number }; label: string }) {
  const [x, z] = gridToWorld(cell.x, cell.y);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.6, -0.8]} castShadow>
        <boxGeometry args={[0.9, 1.2, 0.3]} />
        <meshStandardMaterial color="#2b323c" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.0, -0.64]}>
        <boxGeometry args={[0.5, 0.22, 0.04]} />
        <meshStandardMaterial color="#39d98a" emissive="#39d98a" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[0, 0.25, -0.62]}>
        <boxGeometry args={[0.2, 0.3, 0.08]} />
        <meshStandardMaterial color="#111316" />
      </mesh>
      <Text
        position={[0, 0.03, 0.55]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.3}
        color="#0d1216"
      >
        {label}
      </Text>
    </group>
  );
}

/** Pallets of stock staged in the dock margins, outside the drivable grid. */
function StagedPallets() {
  const cartonTex = useMemo(makeCartonTexture, []);
  const palletTex = useMemo(makePalletTexture, []);
  const items = useMemo(() => {
    const rnd = makeRng(99);
    const pallets: InstanceItem[] = [];
    const cartons: InstanceItem[] = [];
    const wrap: InstanceItem[] = [];
    const spots: Array<[number, number]> = [
      [-GRID_HALF_W - 3.2, -7],
      [-GRID_HALF_W - 3.2, -5.6],
      [-GRID_HALF_W - 3.2, 6],
      [-GRID_HALF_W - 4.4, 7.4],
      [GRID_HALF_W + 3.4, -2],
      [GRID_HALF_W + 3.4, 15],
    ];
    spots.forEach(([x, z], i) => {
      pallets.push({ p: [x, 0.07, z], s: [1.2, 0.14, 1.0], r: [0, (rnd() - 0.5) * 0.2, 0] });
      const h = 0.9 + rnd() * 0.5;
      if (i % 3 === 2) {
        wrap.push({ p: [x, 0.14 + h / 2, z], s: [1.1, h, 0.95] });
      } else {
        for (const dx of [-0.28, 0.28]) {
          for (const dz of [-0.24, 0.24]) {
            cartons.push({ p: [x + dx, 0.14 + 0.25, z + dz], s: [0.5, 0.5, 0.44] });
          }
        }
        cartons.push({ p: [x, 0.14 + 0.5 + 0.22, z], s: [0.8, 0.44, 0.7] });
      }
    });
    return { pallets, cartons, wrap };
  }, []);
  return (
    <group>
      <Instanced items={items.pallets} map={palletTex} roughness={0.9}>
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
      <Instanced items={items.cartons} map={cartonTex} roughness={0.92}>
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
      <Instanced
        items={items.wrap}
        color="#dfe7ee"
        roughness={0.25}
        metalness={0.1}
        transparent
        opacity={0.85}
      >
        <boxGeometry args={[1, 1, 1]} />
      </Instanced>
    </group>
  );
}

function Bollards() {
  const items = useMemo<InstanceItem[]>(() => {
    const out: InstanceItem[] = [];
    const w = BUILDING_W;
    for (const z of [-15.5, -10.5, -2.5, 2.5, 10.5, 15.5]) {
      out.push({ p: [-w / 2 + 1.2, 0.5, z], s: [0.16, 1.0, 0.16] });
    }
    for (const z of [-11.5, -6.5, 6.5, 11.5]) {
      out.push({ p: [w / 2 - 1.2, 0.5, z], s: [0.16, 1.0, 0.16] });
    }
    return out;
  }, []);
  return (
    <Instanced items={items} color={COLOR.bollard} roughness={0.5} metalness={0.3}>
      <cylinderGeometry args={[1, 1, 1, 12]} />
    </Instanced>
  );
}

function Sign({
  position,
  rotation,
  text,
  width,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  text: string;
  width: number;
}) {
  return (
    <group position={position} rotation={rotation ?? [0, 0, 0]}>
      <mesh>
        <boxGeometry args={[width, 0.9, 0.06]} />
        <meshStandardMaterial color="#17324f" roughness={0.6} />
      </mesh>
      <Text
        position={[0, 0, 0.04]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
}

function Signage() {
  const [, topZ] = gridToWorld(0, 2);
  const [, bottomZ] = gridToWorld(0, 18);
  const aisleXs = RACK_XS.slice(0, -1).map((rx) => gridToWorld(rx + 3, 0)[0]);
  return (
    <group>
      {aisleXs.map((x, i) => (
        <group key={i}>
          <Sign position={[x, 6.2, topZ - 0.5]} text={`AISLE ${i + 1}`} width={2.6} />
          <Sign
            position={[x, 6.2, bottomZ + 0.5]}
            rotation={[0, Math.PI, 0]}
            text={`AISLE ${i + 1}`}
            width={2.6}
          />
        </group>
      ))}
      <Sign
        position={[-GRID_HALF_W - MARGIN_X + 0.6, 7.5, 0]}
        rotation={[0, Math.PI / 2, 0]}
        text="RECEIVING"
        width={5}
      />
      <Sign
        position={[GRID_HALF_W + MARGIN_X - 0.6, 7.5, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        text="SHIPPING"
        width={5}
      />
      <Sign
        position={[gridToWorld(6, 0)[0], 5.5, -GRID_HALF_D - MARGIN_Z + 0.9]}
        text="CHARGING BAYS"
        width={5}
      />
    </group>
  );
}

export function Zones() {
  return (
    <group>
      {PICKUPS.map((c, i) => (
        <Station key={`p${i}`} cell={c} label={`PICK-0${i + 1}`} color="#3d7fd6" />
      ))}
      {DROPOFFS.map((c, i) => (
        <Station key={`d${i}`} cell={c} label={`DROP-0${i + 1}`} color="#2f9e6a" />
      ))}
      {CHARGERS.map((c, i) => (
        <Charger key={`c${i}`} cell={c} label={`CHG-0${i + 1}`} />
      ))}
      <Conveyors />
      <StagedPallets />
      <Bollards />
      <Signage />
    </group>
  );
}

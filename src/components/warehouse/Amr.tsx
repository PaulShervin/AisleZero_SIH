import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import { CELL, GRID_H, GRID_W } from "@/sim/grid";
import { SAFE_GAP, getSim } from "@/sim/engine";
import { useSimStore } from "@/sim/store";
import { prefersReducedMotion } from "@/lib/motion";
import type { RobotStatus } from "@/sim/types";
import { AmrTag } from "./AmrTag";
import { makeCartonTexture, makePalletTexture } from "./textures";

/*
 * Low-profile industrial AMR. Footprint 1.3 m x 1.9 m, same as before, so the
 * engine's collision gaps still match what is drawn. Model front is local -Z.
 */
const BODY_WHITE = "#e8eaec";
const BODY_SEAM = "#c9ccd0";
const CHASSIS_BLACK = "#1c1f23";
const PLATFORM = "#2b2f35";
const LOW_BATTERY = 25;
const SAFETY_RADIUS = SAFE_GAP * CELL;
const RING_CLEAR = "#5ad1ff";
const RING_NEAR = "#fbbf24";
const RING_CLOSE = "#ef4444";

const WHEEL_R = 0.19;
const WHEEL_W = 0.16;
const CHASSIS_Y = 0.08; // ground clearance

/** Status light colour and brightness for the LED strips. */
const LED: Record<RobotStatus, { color: string; intensity: number }> = {
  idle: { color: "#3b82f6", intensity: 0.6 },
  to_pickup: { color: "#3b82f6", intensity: 1.4 },
  to_dropoff: { color: "#3b82f6", intensity: 1.4 },
  waiting: { color: "#f59e0b", intensity: 1.6 },
  yielding: { color: "#f59e0b", intensity: 1.2 },
  avoiding: { color: "#f59e0b", intensity: 1.6 },
  charging: { color: "#22c55e", intensity: 1.2 },
  failed: { color: "#ef4444", intensity: 2.2 },
};

function Wheel({
  position,
  innerRef,
}: {
  position: [number, number, number];
  innerRef: React.Ref<THREE.Group>;
}) {
  return (
    <group position={position}>
      {/* axle stub into the chassis */}
      <mesh rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 10]} />
        <meshStandardMaterial color="#111316" metalness={0.6} roughness={0.5} />
      </mesh>
      <group ref={innerRef}>
        <mesh rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[WHEEL_R, WHEEL_R, WHEEL_W, 24]} />
          <meshStandardMaterial color="#141619" roughness={0.95} />
        </mesh>
        {/* tread grooves */}
        {[-0.045, 0.045].map((ox) => (
          <mesh key={ox} position={[ox, 0, 0]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[WHEEL_R + 0.003, WHEEL_R + 0.003, 0.02, 24]} />
            <meshStandardMaterial color="#1f2329" roughness={0.9} />
          </mesh>
        ))}
        {/* metallic hub, both faces */}
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.1, 0.1, WHEEL_W + 0.01, 18]} />
          <meshStandardMaterial color="#8b94a0" metalness={0.85} roughness={0.3} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * (WHEEL_W / 2 + 0.008), 0, 0]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.035, 0.035, 0.01, 12]} />
              <meshStandardMaterial color="#2a303a" metalness={0.7} roughness={0.4} />
            </mesh>
            {Array.from({ length: 5 }).map((_, k) => {
              const a = (k * 2 * Math.PI) / 5;
              return (
                <mesh
                  key={k}
                  position={[
                    side * (WHEEL_W / 2 + 0.008),
                    Math.sin(a) * 0.065,
                    Math.cos(a) * 0.065,
                  ]}
                  rotation-z={Math.PI / 2}
                >
                  <cylinderGeometry args={[0.009, 0.009, 0.012, 6]} />
                  <meshStandardMaterial color="#d8dee9" metalness={0.95} roughness={0.2} />
                </mesh>
              );
            })}
          </group>
        ))}
      </group>
    </group>
  );
}

function Sensor({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.16, 0.08, 0.06]} />
        <meshStandardMaterial color="#0f1114" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, -0.032]}>
        <cylinderGeometry args={[0.022, 0.022, 0.01, 12]} />
        <meshStandardMaterial color="#1b2a4a" metalness={0.8} roughness={0.15} />
      </mesh>
    </group>
  );
}

export function Amr({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null);
  const flWheel = useRef<THREE.Group>(null);
  const rlWheel = useRef<THREE.Group>(null);
  const frWheel = useRef<THREE.Group>(null);
  const rrWheel = useRef<THREE.Group>(null);
  const lidar = useRef<THREE.Group>(null);
  const cargo = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);
  const safety = useRef<THREE.Mesh>(null);
  const body = useRef<THREE.Mesh>(null);
  const reduced = useRef(prefersReducedMotion());
  const cartonTex = useMemo(makeCartonTexture, []);
  const palletTex = useMemo(makePalletTexture, []);
  // One shared material drives every LED strip on this robot.
  const ledMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: LED.idle.color,
        emissive: LED.idle.color,
        emissiveIntensity: LED.idle.intensity,
        roughness: 0.3,
      }),
    [],
  );

  useFrame(({ clock }) => {
    const sim = getSim();
    const r = sim.robots[index];
    const g = group.current;
    if (!r || !g) return;
    const selected = useSimStore.getState().selected === r.id;
    const x = (r.pos.x - (GRID_W - 1) / 2) * CELL;
    const z = (r.pos.y - (GRID_H - 1) / 2) * CELL;
    g.position.set(x, 0, z);
    // Model front is local -Z; yaw is a heading measured clockwise from -Z on the map.
    g.rotation.y = -r.yaw;

    const leftSpin = -(r.leftWheelSpin ?? r.wheelSpin);
    const rightSpin = -(r.rightWheelSpin ?? r.wheelSpin);
    if (flWheel.current) flWheel.current.rotation.x = leftSpin;
    if (rlWheel.current) rlWheel.current.rotation.x = leftSpin;
    if (frWheel.current) frWheel.current.rotation.x = rightSpin;
    if (rrWheel.current) rrWheel.current.rotation.x = rightSpin;

    if (lidar.current) lidar.current.rotation.y = r.lidarSpin;
    if (scan.current) {
      scan.current.rotation.z = r.lidarSpin;
      const mat = scan.current.material as THREE.MeshBasicMaterial;
      mat.opacity = r.status === "failed" ? 0 : r.sensing ? 0.42 : selected ? 0.24 : 0.1;
      mat.color.set(r.sensing ? "#ff8a5b" : "#5ad1ff");
    }
    if (cargo.current) cargo.current.visible = r.carrying;

    // Status LEDs. A fault blinks so it reads even from the overview.
    const led = LED[r.status];
    ledMat.color.set(led.color);
    ledMat.emissive.set(led.color);
    const blink =
      r.status === "failed" && !reduced.current
        ? Math.sin(clock.elapsedTime * 8) > 0
          ? 1
          : 0.25
        : 1;
    ledMat.emissiveIntensity = led.intensity * blink;

    // Safety envelope: colour by the nearest other AMR.
    if (safety.current) {
      let nearest = Infinity;
      for (const o of sim.robots) {
        if (o.id === r.id || o.status === "failed") continue;
        nearest = Math.min(nearest, Math.hypot(o.pos.x - r.pos.x, o.pos.y - r.pos.y));
      }
      const mat = safety.current.material as THREE.MeshBasicMaterial;
      const close = nearest < SAFE_GAP;
      const near = nearest < SAFE_GAP * 2;
      mat.color.set(close ? RING_CLOSE : near ? RING_NEAR : RING_CLEAR);
      mat.opacity = r.status === "failed" ? 0 : close ? 0.75 : near ? 0.45 : selected ? 0.3 : 0.14;
      safety.current.visible = r.status === "idle" ? selected : true;
    }

    // Low battery: upper body breathes amber (unless the viewer prefers reduced motion).
    if (body.current) {
      const mat = body.current.material as THREE.MeshStandardMaterial;
      const low = r.battery <= LOW_BATTERY && r.status !== "charging" && r.status !== "failed";
      if (low) {
        mat.emissiveIntensity = reduced.current
          ? 0.35
          : 0.15 + Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.35;
      } else if (mat.emissiveIntensity !== 0) {
        mat.emissiveIntensity = 0;
      }
    }
  });

  const label = `AMR-0${index + 1}`;
  const id = `R${index + 1}`;

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        useSimStore.getState().select(id);
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      {/* safety envelope on the floor */}
      <mesh ref={safety} rotation-x={-Math.PI / 2} position-y={0.05}>
        <ringGeometry args={[SAFETY_RADIUS - 0.12, SAFETY_RADIUS, 48]} />
        <meshBasicMaterial color={RING_CLEAR} transparent opacity={0.14} depthWrite={false} />
      </mesh>

      {/* lower chassis: black, bevelled, with bumper lip */}
      <RoundedBox
        args={[1.3, 0.24, 1.9]}
        radius={0.05}
        smoothness={3}
        position={[0, CHASSIS_Y + 0.12, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={CHASSIS_BLACK} roughness={0.75} metalness={0.15} />
      </RoundedBox>
      {[-0.955, 0.955].map((oz) => (
        <mesh key={oz} position={[0, CHASSIS_Y + 0.1, oz]} castShadow>
          <boxGeometry args={[1.22, 0.1, 0.05]} />
          <meshStandardMaterial color="#0e1012" roughness={0.95} />
        </mesh>
      ))}

      {/* upper body: white / light grey with a seam line */}
      <RoundedBox
        ref={body}
        args={[1.26, 0.26, 1.84]}
        radius={0.07}
        smoothness={4}
        position={[0, CHASSIS_Y + 0.37, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={BODY_WHITE}
          roughness={0.45}
          metalness={0.08}
          emissive="#f59e0b"
          emissiveIntensity={0}
        />
      </RoundedBox>
      <mesh position={[0, CHASSIS_Y + 0.245, 0]}>
        <boxGeometry args={[1.27, 0.012, 1.85]} />
        <meshStandardMaterial color={BODY_SEAM} roughness={0.6} />
      </mesh>

      {/* top loading platform with anti-slip pads */}
      <mesh position={[0, CHASSIS_Y + 0.52, 0.04]} castShadow receiveShadow>
        <boxGeometry args={[1.08, 0.04, 1.5]} />
        <meshStandardMaterial color={PLATFORM} roughness={0.85} metalness={0.2} />
      </mesh>
      {[-0.42, 0.42].map((ox) =>
        [-0.55, 0.55].map((oz) => (
          <mesh key={`${ox}${oz}`} position={[ox, CHASSIS_Y + 0.548, 0.04 + oz]}>
            <boxGeometry args={[0.16, 0.012, 0.16]} />
            <meshStandardMaterial color="#111316" roughness={1} />
          </mesh>
        )),
      )}

      {/* wheels, partly tucked into the chassis */}
      <Wheel position={[-0.6, WHEEL_R, -0.62]} innerRef={flWheel} />
      <Wheel position={[0.6, WHEEL_R, -0.62]} innerRef={frWheel} />
      <Wheel position={[-0.6, WHEEL_R, 0.62]} innerRef={rlWheel} />
      <Wheel position={[0.6, WHEEL_R, 0.62]} innerRef={rrWheel} />

      {/* LiDAR on a short mount at the front of the top deck */}
      <group position={[0, CHASSIS_Y + 0.5, -0.78]}>
        <mesh position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.1, 0.08, 20]} />
          <meshStandardMaterial color="#0f1114" roughness={0.5} metalness={0.3} />
        </mesh>
        <group ref={lidar} position={[0, 0.14, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.085, 0.085, 0.12, 20]} />
            <meshStandardMaterial color="#1a1d21" metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.07]}>
            <boxGeometry args={[0.07, 0.05, 0.03]} />
            <meshStandardMaterial color="#5a1010" emissive="#ff2222" emissiveIntensity={1.2} />
          </mesh>
        </group>
        <mesh position={[0, 0.215, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.02, 20]} />
          <meshStandardMaterial color="#0f1114" />
        </mesh>
      </group>

      {/* LiDAR sweep on the floor */}
      <mesh ref={scan} position={[0, 0.09, -0.78]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[3.4, 40, 0, Math.PI * 0.8]} />
        <meshBasicMaterial
          color="#5ad1ff"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* front depth cameras */}
      <Sensor position={[-0.38, CHASSIS_Y + 0.37, -0.93]} />
      <Sensor position={[0.38, CHASSIS_Y + 0.37, -0.93]} />
      {/* rear obstacle sensor */}
      <mesh position={[0, CHASSIS_Y + 0.37, 0.93]}>
        <boxGeometry args={[0.2, 0.06, 0.04]} />
        <meshStandardMaterial color="#0f1114" roughness={0.5} />
      </mesh>

      {/* status LED strips: front, sides, rear */}
      <mesh position={[0, CHASSIS_Y + 0.26, -0.952]} material={ledMat}>
        <boxGeometry args={[0.9, 0.025, 0.012]} />
      </mesh>
      <mesh position={[0, CHASSIS_Y + 0.26, 0.952]} material={ledMat}>
        <boxGeometry args={[0.6, 0.025, 0.012]} />
      </mesh>
      {[-0.655, 0.655].map((ox) => (
        <mesh key={ox} position={[ox, CHASSIS_Y + 0.26, 0]} material={ledMat}>
          <boxGeometry args={[0.012, 0.025, 1.4]} />
        </mesh>
      ))}

      {/* branding and ID */}
      {[-1, 1].map((side) => (
        <Text
          key={side}
          position={[side * 0.636, CHASSIS_Y + 0.4, 0.15]}
          rotation={[0, side * (Math.PI / 2), 0]}
          fontSize={0.1}
          color="#3a3f46"
          anchorX="center"
          anchorY="middle"
        >
          AisleZero
        </Text>
      ))}
      <Text
        position={[0, CHASSIS_Y + 0.506, -0.55]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.13}
        color="#2b2f35"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      <Text
        position={[0, CHASSIS_Y + 0.4, 0.93]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.09}
        color="#3a3f46"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>

      {/* carried load: pallet with a carton, shown only while carrying */}
      <group ref={cargo} position={[0, CHASSIS_Y + 0.54, 0.04]} visible={false}>
        <mesh position={[0, 0.06, 0]} castShadow>
          <boxGeometry args={[1.0, 0.12, 1.2]} />
          <meshStandardMaterial map={palletTex} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.12 + 0.3, 0]} castShadow>
          <boxGeometry args={[0.9, 0.6, 1.05]} />
          <meshStandardMaterial map={cartonTex} roughness={0.92} />
        </mesh>
      </group>

      <AmrTag index={index} />
    </group>
  );
}

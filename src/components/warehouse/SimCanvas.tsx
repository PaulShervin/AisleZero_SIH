import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { getSim } from "@/sim/engine";
import { useSimStore } from "@/sim/store";
import { Warehouse } from "./Warehouse";
import { Amr } from "./Amr";
import { BlockedCells, ConflictMarkers, Obstacles, PathLines, SelectionRing } from "./Overlays";
import { CAMERA_FOV, CAMERA_POSITION, CAMERA_TARGET, registerCameraControls } from "./camera";
import { CameraRig } from "./CameraRig";
import { BUILDING_D, BUILDING_W } from "./layout";
import { YieldLinks } from "./YieldLinks";
import { StationBadges } from "./StationBadges";
import { HeatMap } from "./HeatMap";
import { FocusMarker } from "./FocusMarker";

const AMR_COUNT = 3;

function Ticker() {
  const acc = useRef(0);
  useFrame((_, dt) => {
    const sim = getSim();
    sim.step(dt);
    acc.current += dt;
    if (acc.current >= 0.1) {
      acc.current = 0;
      useSimStore.getState().refresh();
    }
  });
  return null;
}

export function SimCanvas() {
  const cameraMode = useSimStore((s) => s.cameraMode);
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#171a1f"]} />
      <fog attach="fog" args={["#171a1f", 120, 300]} />

      {/* Neutral daylight-balanced industrial lighting: soft sky fill plus one key light for shadows. */}
      <hemisphereLight args={["#e3e9f0", "#5a5d61", 0.6]} />
      <ambientLight intensity={0.32} />
      <directionalLight
        position={[26, 42, 18]}
        intensity={1.15}
        color="#fff4e4"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-BUILDING_W / 2}
        shadow-camera-right={BUILDING_W / 2}
        shadow-camera-top={BUILDING_D / 2}
        shadow-camera-bottom={-BUILDING_D / 2}
        shadow-camera-far={140}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-30, 26, -22]} intensity={0.4} color="#c9d6e6" />

      <Environment>
        <Lightformer intensity={1.6} position={[0, 22, 0]} scale={[48, 36, 1]} />
        <Lightformer
          intensity={0.8}
          color="#cfe0f0"
          position={[-25, 10, 0]}
          rotation-y={Math.PI / 2}
          scale={[50, 6, 1]}
        />
        <Lightformer
          intensity={0.8}
          color="#f2e2c6"
          position={[25, 10, 0]}
          rotation-y={-Math.PI / 2}
          scale={[50, 6, 1]}
        />
      </Environment>

      <Suspense fallback={null}>
        <Warehouse />
        {Array.from({ length: AMR_COUNT }).map((_, i) => (
          <Amr key={i} index={i} />
        ))}
        <Obstacles />
        <BlockedCells />
        <HeatMap />
        <PathLines />
        <YieldLinks count={AMR_COUNT} />
        <StationBadges />
        <ConflictMarkers />
        <SelectionRing />
        <FocusMarker />
        <ContactShadows
          position={[0, 0.02, 0]}
          scale={BUILDING_W}
          opacity={0.45}
          blur={2.2}
          far={5}
          resolution={1024}
        />
      </Suspense>

      <Ticker />
      <CameraRig />
      <OrbitControls
        ref={registerCameraControls}
        makeDefault
        enabled={cameraMode === "overview"}
        target={CAMERA_TARGET}
        minDistance={6}
        maxDistance={170}
        maxPolarAngle={Math.PI / 2.08}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}

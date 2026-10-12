import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { CELL, GRID_H, GRID_W } from "@/sim/grid";
import { getSim } from "@/sim/engine";
import { useSimStore, type CameraMode } from "@/sim/store";
import { CAMERA_FOV, currentFly, finishFly, getCameraControls, resetCamera } from "./camera";

const FLY_RATE = 4;
const FLY_DONE_DISTANCE = 0.15;

const POV_FOV = 72;
const FOV_BY_MODE: Record<CameraMode, number> = {
  overview: CAMERA_FOV,
  chase: 55,
  pov: POV_FOV,
};

/**
 * Drives the scene camera from the selected AMR while in "chase" / "pov" mode.
 * In "overview" it does nothing, so OrbitControls keeps full control.
 * Switching AMR in the fleet panel re-targets the camera; the mode is kept.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const mode = useSimStore((s) => s.cameraMode);
  const desiredPos = useRef(new THREE.Vector3());
  const desiredLook = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const needsSnap = useRef(false);

  useEffect(() => {
    camera.fov = FOV_BY_MODE[mode];
    camera.updateProjectionMatrix();
    if (mode === "overview") {
      resetCamera();
    } else {
      needsSnap.current = true;
    }
  }, [mode, camera]);

  useFrame((_, dt) => {
    if (mode === "overview") {
      const fly = currentFly();
      const controls = getCameraControls();
      if (!fly || !controls) return;
      const k = 1 - Math.exp(-FLY_RATE * dt);
      desiredPos.current.set(...fly.position);
      desiredLook.current.set(...fly.target);
      camera.position.lerp(desiredPos.current, k);
      controls.target.lerp(desiredLook.current, k);
      controls.update();
      if (camera.position.distanceTo(desiredPos.current) < FLY_DONE_DISTANCE) finishFly();
      return;
    }
    const selected = useSimStore.getState().selected;
    if (!selected) return;
    const r = getSim().robots[Number(selected.slice(1)) - 1];
    if (!r) return;

    const x = (r.pos.x - (GRID_W - 1) / 2) * CELL;
    const z = (r.pos.y - (GRID_H - 1) / 2) * CELL;
    // Travel direction in world space (matches the engine's yaw = atan2(dx, -dy)).
    const fx = Math.sin(r.yaw);
    const fz = -Math.cos(r.yaw);

    if (mode === "pov") {
      desiredPos.current.set(x + fx * 0.3, 1.5, z + fz * 0.3);
      desiredLook.current.set(x + fx * 12, 1.1, z + fz * 12);
    } else {
      desiredPos.current.set(x - fx * 6, 3.6, z - fz * 6);
      desiredLook.current.set(x + fx * 3, 0.6, z + fz * 3);
    }

    if (needsSnap.current) {
      look.current.copy(desiredLook.current);
      needsSnap.current = false;
    }
    // POV stays tight to the robot; chase is looser for a smoother feel.
    const rate = mode === "pov" ? 16 : 6;
    const k = 1 - Math.exp(-rate * dt);
    camera.position.lerp(desiredPos.current, k);
    look.current.lerp(desiredLook.current, k);
    camera.lookAt(look.current);
  });

  return null;
}

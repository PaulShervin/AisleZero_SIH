import type { ComponentRef } from "react";
import type { OrbitControls } from "@react-three/drei";
import { gridToWorld, type Vec2 } from "@/sim/grid";
import { useSimStore } from "@/sim/store";

export const CAMERA_POSITION: [number, number, number] = [0, 36, 46];
export const CAMERA_FOV = 46;
export const CAMERA_TARGET: [number, number, number] = [0, 1, 0];

/** Offset from the target when flying to a cell: close, from the south. */
const FLY_OFFSET: [number, number, number] = [0, 13, 15];

export interface FlyRequest {
  target: [number, number, number];
  position: [number, number, number];
}

let controlsInstance: ComponentRef<typeof OrbitControls> | null = null;
let pendingFly: FlyRequest | null = null;

/** Called by SimCanvas when its OrbitControls mount / unmount. */
export function registerCameraControls(controls: ComponentRef<typeof OrbitControls> | null) {
  controlsInstance = controls;
}

export function getCameraControls() {
  return controlsInstance;
}

/** Return the camera to its initial framing. No-op until the canvas has mounted. */
export function resetCamera() {
  pendingFly = null;
  const controls = controlsInstance;
  if (!controls) return;
  controls.object.position.set(...CAMERA_POSITION);
  controls.target.set(...CAMERA_TARGET);
  const cam = controls.object as { fov?: number; updateProjectionMatrix?: () => void };
  if (cam.fov !== undefined) {
    cam.fov = CAMERA_FOV;
    cam.updateProjectionMatrix?.();
  }
  controls.update();
}

/**
 * Ask the camera to glide to a grid cell. Leaves any follow mode first so the
 * orbit camera is in charge. CameraRig performs the motion over a few frames.
 */
export function flyToCell(cell: Vec2) {
  const store = useSimStore.getState();
  if (store.cameraMode !== "overview") store.setCameraMode("overview");
  const [x, z] = gridToWorld(cell.x, cell.y);
  pendingFly = {
    target: [x, 0.5, z],
    position: [x + FLY_OFFSET[0], FLY_OFFSET[1], z + FLY_OFFSET[2]],
  };
}

/** The fly request still in progress, if any. */
export function currentFly(): FlyRequest | null {
  return pendingFly;
}

export function finishFly() {
  pendingFly = null;
}

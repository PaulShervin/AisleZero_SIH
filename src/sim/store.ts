import { create } from "zustand";
import { getSim } from "./engine";
import type { Snapshot } from "./types";
import type { Vec2 } from "./grid";

export type CameraMode = "overview" | "chase" | "pov";

/** A spot the user jumped to from the activity log or minimap. */
export interface Focus {
  cell: Vec2;
  label: string;
  /** Wall-clock ms, used to fade the marker out. */
  at: number;
}

interface UiState {
  snap: Snapshot;
  showPaths: boolean;
  selected: string | null;
  cameraMode: CameraMode;
  showHeat: boolean;
  focus: Focus | null;
  refresh: () => void;
  setShowPaths: (v: boolean) => void;
  select: (id: string | null) => void;
  setCameraMode: (m: CameraMode) => void;
  setShowHeat: (v: boolean) => void;
  setFocus: (f: Focus | null) => void;
}

export const useSimStore = create<UiState>((set) => ({
  snap: getSim().snapshot(),
  showPaths: true,
  selected: "R1",
  cameraMode: "overview",
  showHeat: false,
  focus: null,
  refresh: () => set({ snap: getSim().snapshot() }),
  setShowPaths: (v) => set({ showPaths: v }),
  select: (id) => set({ selected: id }),
  setCameraMode: (m) => set({ cameraMode: m }),
  setShowHeat: (v) => set({ showHeat: v }),
  setFocus: (f) => set({ focus: f }),
}));

// Plain-English labels and badge styling for simulation state.
// Everything here maps 1:1 onto values the engine actually produces.

import type { ComponentType } from "react";
import {
  ArrowDownToLine,
  BatteryCharging,
  BatteryLow,
  Circle,
  ClipboardList,
  Construction,
  Hand,
  Info,
  OctagonAlert,
  PackageCheck,
  Route,
  Truck,
  UserRoundCheck,
  Waypoints,
} from "lucide-react";
import { DROPOFFS, PICKUPS, type Vec2 } from "@/sim/grid";
import type { EventKind, RobotStatus, TaskStatus } from "@/sim/types";

type IconType = ComponentType<{ className?: string }>;

/** A glyph for every robot state so status never relies on colour alone. */
export const STATUS_ICON: Record<RobotStatus, IconType> = {
  idle: Circle,
  to_pickup: ArrowDownToLine,
  to_dropoff: Truck,
  waiting: Hand,
  avoiding: Route,
  charging: BatteryCharging,
  failed: OctagonAlert,
};

export const EVENT_ICON: Record<EventKind, IconType> = {
  info: Info,
  task: ClipboardList,
  assign: UserRoundCheck,
  delivery: PackageCheck,
  conflict: Hand,
  reroute: Waypoints,
  failure: OctagonAlert,
  obstacle: Construction,
  battery: BatteryLow,
};

export type Tone = "ok" | "warn" | "fail" | "info" | "idle";

export const TONE_BADGE: Record<Tone, string> = {
  ok: "bg-signal-ok-soft text-signal-ok border-signal-ok/20",
  warn: "bg-signal-warn-soft text-signal-warn border-signal-warn/25",
  fail: "bg-signal-fail-soft text-signal-fail border-signal-fail/25",
  info: "bg-signal-info-soft text-signal-info border-signal-info/20",
  idle: "bg-signal-idle-soft text-signal-idle border-signal-idle/20",
};

export const TONE_DOT: Record<Tone, string> = {
  ok: "bg-signal-ok",
  warn: "bg-signal-warn",
  fail: "bg-signal-fail",
  info: "bg-signal-info",
  idle: "bg-signal-idle",
};

export const ROBOT_STATUS: Record<RobotStatus, { label: string; tone: Tone }> = {
  idle: { label: "Idle", tone: "idle" },
  to_pickup: { label: "Picking Up", tone: "info" },
  to_dropoff: { label: "Delivering", tone: "ok" },
  waiting: { label: "Waiting", tone: "warn" },
  avoiding: { label: "Avoiding", tone: "warn" },
  charging: { label: "Charging", tone: "info" },
  failed: { label: "Failed", tone: "fail" },
};

export const TASK_STATUS: Record<TaskStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "warn" },
  assigned: { label: "Assigned", tone: "info" },
  carrying: { label: "In Transit", tone: "info" },
  done: { label: "Completed", tone: "ok" },
};

export const EVENT_KIND: Record<EventKind, { label: string; tone: Tone }> = {
  info: { label: "Info", tone: "idle" },
  task: { label: "Task", tone: "info" },
  assign: { label: "Assignment", tone: "info" },
  delivery: { label: "Delivery", tone: "ok" },
  conflict: { label: "Conflict", tone: "warn" },
  reroute: { label: "Reroute", tone: "warn" },
  failure: { label: "Failure", tone: "fail" },
  obstacle: { label: "Obstacle", tone: "warn" },
  battery: { label: "Battery", tone: "info" },
};

/** Task urgency is 1..3 in the engine. */
export const PRIORITY: Record<number, { label: string; tone: Tone }> = {
  1: { label: "Routine", tone: "idle" },
  2: { label: "Elevated", tone: "info" },
  3: { label: "Urgent", tone: "warn" },
};

const sameCell = (a: Vec2, b: Vec2) => a.x === b.x && a.y === b.y;

/** Station name as painted on the warehouse floor, falling back to the grid cell. */
export function stationLabel(cell: Vec2): string {
  const p = PICKUPS.findIndex((c) => sameCell(c, cell));
  if (p >= 0) return `PICK-0${p + 1}`;
  const d = DROPOFFS.findIndex((c) => sameCell(c, cell));
  if (d >= 0) return `DROP-0${d + 1}`;
  return `(${cell.x}, ${cell.y})`;
}

export function formatSimTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return m > 0 ? `${m}m ${s.toFixed(1)}s` : `${s.toFixed(1)}s`;
}

export function batteryTone(battery: number): Tone {
  if (battery > 50) return "ok";
  if (battery > 20) return "warn";
  return "fail";
}

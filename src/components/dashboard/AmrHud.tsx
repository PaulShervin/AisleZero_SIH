import { cn } from "@/lib/utils";
import { useSimStore } from "@/sim/store";
import { amrIndex, amrColor } from "@/sim/palette";
import { ROBOT_STATUS, STATUS_ICON, TONE_DOT, batteryTone, stationLabel } from "./sim-labels";

/** Onboard-style readout shown while the camera follows an AMR. */
export function AmrHud() {
  const cameraMode = useSimStore((s) => s.cameraMode);
  const selected = useSimStore((s) => s.selected);
  const robots = useSimStore((s) => s.snap.robots);
  const tasks = useSimStore((s) => s.snap.tasks);
  if (cameraMode === "overview" || !selected) return null;
  const robot = robots.find((r) => r.id === selected);
  if (!robot) return null;

  const color = amrColor(amrIndex(robot.id));
  const status = ROBOT_STATUS[robot.status];
  const Icon = STATUS_ICON[robot.status];
  const battery = Math.round(robot.battery);
  const task = robot.taskId ? tasks.find((t) => t.id === robot.taskId) : null;
  const holding = robot.holdingFor ? robots.find((r) => r.id === robot.holdingFor) : null;
  const left = Math.max(0, robot.path.length - robot.pathIndex);

  return (
    <div className="pointer-events-none absolute right-3 top-3 w-[230px] rounded-lg border border-white/15 bg-[#10141b]/90 p-2.5 font-mono text-[11px] text-white shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-bold">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
          {robot.name}
        </span>
        <span className="flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold">
          ● {cameraMode === "pov" ? "AMR VIEW" : "FOLLOW"}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{status.label}</span>
        {robot.sensing && <span className="ml-auto text-sky-300">LiDAR ◉</span>}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
          <div
            className={cn("h-full rounded-full", TONE_DOT[batteryTone(robot.battery)])}
            style={{ width: `${Math.max(3, battery)}%` }}
          />
        </div>
        <span className="w-9 text-right tabular-nums">{battery}%</span>
      </div>

      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[10.5px]">
        <dt className="text-white/60">Task</dt>
        <dd>{task ? task.id : "—"}</dd>
        <dt className="text-white/60">Heading to</dt>
        <dd>{robot.dest ? stationLabel(robot.dest) : "—"}</dd>
        <dt className="text-white/60">Waypoints</dt>
        <dd className="tabular-nums">{left}</dd>
        <dt className="text-white/60">Speed</dt>
        <dd className="tabular-nums">{robot.speed.toFixed(1)} cells/s</dd>
        <dt className="text-white/60">Travelled</dt>
        <dd className="tabular-nums">{robot.distance.toFixed(0)} cells</dd>
      </dl>

      {holding && (
        <div className="mt-2 rounded bg-amber-500/15 px-1.5 py-1 text-amber-200">
          ⏸ Yielding to {holding.name}
        </div>
      )}
      <div className="mt-2 border-t border-white/10 pt-1.5 text-[10px] leading-snug text-white/75">
        {robot.lastEvent}
      </div>
    </div>
  );
}

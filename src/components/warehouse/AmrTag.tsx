import { Html } from "@react-three/drei";
import { cn } from "@/lib/utils";
import { useSimStore } from "@/sim/store";
import { amrColor } from "@/sim/palette";
import {
  ROBOT_STATUS,
  STATUS_ICON,
  batteryTone,
  stationLabel,
} from "@/components/dashboard/sim-labels";

const RING_R = 9;
const RING_C = 2 * Math.PI * RING_R;
const ASSIGN_BUBBLE_SECONDS = 4;
const LOW_BATTERY = 25;

const TONE_TEXT = {
  ok: "text-emerald-300",
  warn: "text-amber-300",
  fail: "text-rose-300",
  info: "text-sky-300",
  idle: "text-zinc-300",
} as const;

const TONE_STROKE = {
  ok: "#34d399",
  warn: "#fbbf24",
  fail: "#f87171",
  info: "#38bdf8",
  idle: "#a1a1aa",
} as const;

/**
 * Billboard label above an AMR: name, status, battery ring, task and the
 * reason it is waiting. Always faces the camera and keeps a readable size.
 */
export function AmrTag({ index }: { index: number }) {
  const robot = useSimStore((s) => s.snap.robots[index]);
  const tasks = useSimStore((s) => s.snap.tasks);
  const robots = useSimStore((s) => s.snap.robots);
  const now = useSimStore((s) => s.snap.time);
  const selected = useSimStore((s) => s.selected);
  const cameraMode = useSimStore((s) => s.cameraMode);
  if (!robot) return null;
  // The follow/AMR-view readout already shows this robot; a tag would fill the screen.
  if (cameraMode !== "overview" && selected === robot.id) return null;

  const color = amrColor(index);
  const status = ROBOT_STATUS[robot.status];
  const Icon = STATUS_ICON[robot.status];
  const battery = Math.round(robot.battery);
  const tone = batteryTone(robot.battery);
  const low = robot.battery <= LOW_BATTERY && robot.status !== "charging";
  const isSelected = selected === robot.id;
  const holding = robot.holdingFor ? robots.find((r) => r.id === robot.holdingFor) : null;
  const task = robot.taskId ? tasks.find((t) => t.id === robot.taskId) : null;
  const decision = task?.allocation;
  const freshDecision =
    decision && decision.robotId === robot.id && now - decision.t < ASSIGN_BUBBLE_SECONDS
      ? decision
      : null;

  return (
    <Html position={[0, 2.2, 0]} center zIndexRange={[40, 0]} style={{ pointerEvents: "none" }}>
      <div
        className={cn(
          "flex select-none flex-col items-center gap-1",
          isSelected ? "opacity-100" : "opacity-90",
        )}
      >
        {freshDecision && (
          <div className="whitespace-nowrap rounded-md border border-sky-400/60 bg-sky-950/90 px-2 py-0.5 font-mono text-[10px] text-sky-100 shadow-lg">
            Won {task?.id} · score {freshDecision.score.toFixed(1)}
            {freshDecision.alternatives[0] && (
              <span className="text-sky-300/80">
                {" "}
                vs {freshDecision.alternatives[0].score.toFixed(1)}
              </span>
            )}
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border bg-[#10141b]/92 py-1 pl-1.5 pr-2.5 shadow-xl backdrop-blur-sm",
            isSelected ? "border-white/70" : "border-white/15",
            low && "animate-pulse motion-reduce:animate-none",
          )}
          style={{ boxShadow: isSelected ? `0 0 0 2px ${color}` : undefined }}
        >
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <circle cx="13" cy="13" r={RING_R} fill="none" stroke="#2a3038" strokeWidth="3" />
            <circle
              cx="13"
              cy="13"
              r={RING_R}
              fill="none"
              stroke={TONE_STROKE[tone]}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(RING_C * battery) / 100} ${RING_C}`}
              transform="rotate(-90 13 13)"
            />
            <text
              x="13"
              y="16.5"
              textAnchor="middle"
              fontSize="8"
              fontFamily="ui-monospace, monospace"
              fontWeight="700"
              fill="#e5e7eb"
            >
              {battery}
            </text>
          </svg>

          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
              <span className="font-mono text-[11px] font-bold text-white">{robot.name}</span>
              <span className={cn("flex items-center gap-0.5 text-[10px]", TONE_TEXT[status.tone])}>
                <Icon className="h-3 w-3" aria-hidden="true" />
                {status.label}
              </span>
            </div>
            <div className="whitespace-nowrap font-mono text-[9.5px] text-zinc-300">
              {task
                ? `${task.id} → ${stationLabel(robot.carrying ? task.dropoff : task.pickup)}`
                : robot.status === "charging"
                  ? "Charging"
                  : "No task"}
              {low && <span className="ml-1 text-amber-300">· LOW BATTERY</span>}
            </div>
            {holding && (
              <div className="whitespace-nowrap font-mono text-[9.5px] text-amber-300">
                ⏸ yielding to {holding.name}
              </div>
            )}
          </div>
        </div>
      </div>
    </Html>
  );
}

import { Html } from "@react-three/drei";
import { cn } from "@/lib/utils";
import { useSimStore } from "@/sim/store";
import { amrColor } from "@/sim/palette";
import { STATUS_ICON, batteryTone } from "@/components/dashboard/sim-labels";

const SIZE = 38;
const RING_R = 16.5;
const RING_C = 2 * Math.PI * RING_R;
const LOW_BATTERY = 25;

const TONE_STROKE = {
  ok: "#34d399",
  warn: "#fbbf24",
  fail: "#f87171",
  info: "#38bdf8",
  idle: "#a1a1aa",
} as const;

/**
 * Compact badge above an AMR: colour ring, number, status glyph and a thin
 * battery arc. Always faces the camera and keeps a fixed size on screen.
 */
export function AmrTag({ index }: { index: number }) {
  const robot = useSimStore((s) => s.snap.robots[index]);
  const selected = useSimStore((s) => s.selected);
  const cameraMode = useSimStore((s) => s.cameraMode);
  if (!robot) return null;
  // The follow/AMR-view readout already shows this robot.
  if (cameraMode !== "overview" && selected === robot.id) return null;

  const color = amrColor(index);
  const Icon = STATUS_ICON[robot.status];
  const battery = Math.max(0, Math.min(100, robot.battery));
  const tone = batteryTone(robot.battery);
  const low = robot.battery <= LOW_BATTERY && robot.status !== "charging";
  const failed = robot.status === "failed";
  const slowed =
    robot.status === "yielding" || robot.status === "waiting" || robot.status === "avoiding";
  const isSelected = selected === robot.id;
  const ringColor = failed ? "#ef4444" : color;
  const c = SIZE / 2;

  return (
    <Html position={[0, 1.9, 0]} center zIndexRange={[40, 0]} style={{ pointerEvents: "none" }}>
      <div
        className={cn(
          "relative select-none",
          low && "animate-pulse motion-reduce:animate-none",
          isSelected ? "opacity-100" : "opacity-90",
        )}
        style={{ width: SIZE, height: SIZE }}
        title={robot.name}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          {isSelected && (
            <circle cx={c} cy={c} r={c - 0.5} fill="none" stroke="#ffffff" strokeWidth="1.5" />
          )}
          <circle cx={c} cy={c} r={RING_R} fill="#10141b" stroke="#2a3038" strokeWidth="2.5" />
          {/* battery arc */}
          <circle
            cx={c}
            cy={c}
            r={RING_R}
            fill="none"
            stroke={TONE_STROKE[tone]}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${(RING_C * battery) / 100} ${RING_C}`}
            transform={`rotate(-90 ${c} ${c})`}
          />
          {/* identity ring */}
          <circle cx={c} cy={c} r={RING_R - 3.5} fill="none" stroke={ringColor} strokeWidth="1.5" />
          <text
            x={c}
            y={c + 9.5}
            textAnchor="middle"
            fontSize="8"
            fontFamily="ui-monospace, monospace"
            fontWeight="700"
            fill="#e5e7eb"
          >
            {String(index + 1).padStart(2, "0")}
          </text>
        </svg>
        <Icon
          className={cn(
            "absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-[80%]",
            failed ? "text-rose-400" : slowed ? "text-amber-300" : "text-sky-200",
          )}
          aria-hidden="true"
        />
      </div>
    </Html>
  );
}

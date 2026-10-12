import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSimStore, type CameraMode } from "@/sim/store";
import { amrColor } from "@/sim/palette";
import { ROBOT_STATUS, STATUS_ICON } from "./sim-labels";

const CAMERA_MODES: { mode: CameraMode; label: string; hint: string }[] = [
  { mode: "overview", label: "Overview", hint: "Free orbit camera" },
  { mode: "chase", label: "Follow", hint: "Camera trails the selected AMR" },
  { mode: "pov", label: "AMR view", hint: "See what the selected AMR sees" },
];

const chip =
  "flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-white/80 transition-colors";

/** Camera mode, AMR picker and overlay toggles, docked in the 3D viewport corner. */
export function CameraToolbar() {
  const cameraMode = useSimStore((s) => s.cameraMode);
  const setCameraMode = useSimStore((s) => s.setCameraMode);
  const selected = useSimStore((s) => s.selected);
  const select = useSimStore((s) => s.select);
  const robots = useSimStore((s) => s.snap.robots);
  const showHeat = useSimStore((s) => s.showHeat);
  const setShowHeat = useSimStore((s) => s.setShowHeat);

  return (
    <div className="absolute left-3 top-3 flex flex-col gap-1.5">
      <div className="flex rounded-md bg-black/60 p-0.5 backdrop-blur-sm">
        {CAMERA_MODES.map(({ mode, label, hint }) => (
          <button
            key={mode}
            type="button"
            title={hint}
            aria-pressed={cameraMode === mode}
            onClick={() => setCameraMode(mode)}
            className={cn(chip, cameraMode === mode ? "bg-white text-black" : "hover:bg-white/15")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-0.5 rounded-md bg-black/60 p-0.5 backdrop-blur-sm">
        {robots.map((robot, i) => {
          const color = amrColor(i);
          const Icon = STATUS_ICON[robot.status];
          const active = selected === robot.id;
          return (
            <button
              key={robot.id}
              type="button"
              aria-pressed={active}
              title={`${robot.name} · ${ROBOT_STATUS[robot.status].label} · ${Math.round(robot.battery)}%`}
              onClick={() => select(robot.id)}
              className={cn(chip, !active && "hover:bg-white/15")}
              style={active ? { background: color, color: "#0b0e12" } : undefined}
            >
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: active ? "#0b0e12" : color }}
                aria-hidden="true"
              />
              {robot.name.replace("AMR-", "")}
              <Icon className="h-3 w-3" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="flex rounded-md bg-black/60 p-0.5 backdrop-blur-sm">
        <button
          type="button"
          aria-pressed={showHeat}
          title="Colour aisles by how often robots drive through them"
          onClick={() => setShowHeat(!showHeat)}
          className={cn(chip, showHeat ? "bg-orange-400 text-black" : "hover:bg-white/15")}
        >
          <Flame className="h-3 w-3" aria-hidden="true" />
          Traffic heat
        </button>
      </div>
    </div>
  );
}

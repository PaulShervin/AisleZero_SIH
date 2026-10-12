import { useMemo } from "react";
import { CHARGERS, DROPOFFS, GRID_H, GRID_W, PICKUPS, RACK_RUNS, type Vec2 } from "@/sim/grid";
import { useSimStore } from "@/sim/store";
import { amrColor } from "@/sim/palette";
import { flyToCell } from "@/components/warehouse/camera";

const SCALE = 6;
const W = GRID_W * SCALE;
const H = GRID_H * SCALE;

/** Top-down overview of the whole floor; click a robot to select it, click elsewhere to fly there. */
export function MiniMap() {
  const robots = useSimStore((s) => s.snap.robots);
  const obstacles = useSimStore((s) => s.snap.obstacles);
  const blocked = useSimStore((s) => s.snap.blockedCells);
  const selected = useSimStore((s) => s.selected);
  const select = useSimStore((s) => s.select);
  const setFocus = useSimStore((s) => s.setFocus);

  const racks = useMemo(
    () =>
      RACK_RUNS.map((r) => ({
        x: r.x * SCALE,
        y: r.z0 * SCALE,
        w: 2 * SCALE,
        h: (r.z1 - r.z0 + 1) * SCALE,
      })),
    [],
  );

  const onClickFloor = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cell: Vec2 = {
      x: Math.floor(((e.clientX - rect.left) / rect.width) * GRID_W),
      y: Math.floor(((e.clientY - rect.top) / rect.height) * GRID_H),
    };
    flyToCell(cell);
    setFocus({ cell, label: `Cell (${cell.x}, ${cell.y})`, at: Date.now() });
  };

  return (
    <svg
      viewBox={`-1 -1 ${W + 2} ${H + 2}`}
      width={W}
      height={H}
      role="img"
      aria-label="Warehouse minimap"
      onClick={onClickFloor}
      className="absolute bottom-3 right-3 cursor-crosshair rounded-md border border-white/15 bg-[#0d1117]/85 shadow-xl backdrop-blur-sm"
    >
      {racks.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="#7a3d12" rx={1} />
      ))}
      {PICKUPS.map((c, i) => (
        <rect
          key={`p${i}`}
          x={c.x * SCALE}
          y={c.y * SCALE}
          width={SCALE}
          height={SCALE}
          fill="#2563eb"
        />
      ))}
      {DROPOFFS.map((c, i) => (
        <rect
          key={`d${i}`}
          x={c.x * SCALE}
          y={c.y * SCALE}
          width={SCALE}
          height={SCALE}
          fill="#16a34a"
        />
      ))}
      {CHARGERS.map((c, i) => (
        <rect
          key={`c${i}`}
          x={c.x * SCALE}
          y={c.y * SCALE}
          width={SCALE}
          height={SCALE}
          fill="#0f766e"
        />
      ))}
      {blocked.map((k) => {
        const [x = 0, y = 0] = k.split(",").map(Number);
        return (
          <rect
            key={k}
            x={x * SCALE}
            y={y * SCALE}
            width={SCALE}
            height={SCALE}
            fill="#b91c1c"
            opacity={0.8}
          />
        );
      })}
      {obstacles.map((o) => (
        <rect
          key={o.id}
          x={(o.pos.x + 0.2) * SCALE}
          y={(o.pos.y + 0.2) * SCALE}
          width={SCALE * 0.6}
          height={SCALE * 0.6}
          fill={o.kind === "worker" ? "#facc15" : "#a16207"}
        />
      ))}
      {robots.map((r, i) => {
        const cx = (r.pos.x + 0.5) * SCALE;
        const cy = (r.pos.y + 0.5) * SCALE;
        const color = amrColor(i);
        const hx = cx + Math.sin(r.yaw) * SCALE * 0.9;
        const hy = cy - Math.cos(r.yaw) * SCALE * 0.9;
        const isSel = selected === r.id;
        return (
          <g
            key={r.id}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              select(r.id);
            }}
          >
            {isSel && (
              <circle cx={cx} cy={cy} r={SCALE * 0.95} fill="none" stroke="#fff" strokeWidth={1} />
            )}
            <line x1={cx} y1={cy} x2={hx} y2={hy} stroke={color} strokeWidth={1.4} />
            <circle
              cx={cx}
              cy={cy}
              r={SCALE * 0.55}
              fill={r.status === "failed" ? "#ef4444" : color}
              stroke="#0d1117"
              strokeWidth={0.8}
            />
          </g>
        );
      })}
    </svg>
  );
}

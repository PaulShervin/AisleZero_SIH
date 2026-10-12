import { Html } from "@react-three/drei";
import { DROPOFFS, PICKUPS, gridToWorld, type Vec2 } from "@/sim/grid";
import { useSimStore } from "@/sim/store";
import { cn } from "@/lib/utils";

const FLASH_SECONDS = 2.5;

const same = (a: Vec2, b: Vec2) => a.x === b.x && a.y === b.y;

/** "N waiting" over pickup bays, and a short flash on a drop-off when a delivery lands. */
export function StationBadges() {
  const tasks = useSimStore((s) => s.snap.tasks);
  const events = useSimStore((s) => s.snap.events);
  const now = useSimStore((s) => s.snap.time);

  const recentDeliveries = events.filter(
    (e) => e.kind === "delivery" && e.cell && now - e.t < FLASH_SECONDS,
  );

  return (
    <group>
      {PICKUPS.map((cell, i) => {
        const waiting = tasks.filter(
          (t) => (t.status === "pending" || t.status === "assigned") && same(t.pickup, cell),
        );
        if (waiting.length === 0) return null;
        const [x, z] = gridToWorld(cell.x, cell.y);
        const urgent = waiting.some((t) => t.urgency >= 3);
        return (
          <Html key={`pick-${i}`} position={[x, 1.6, z]} center style={{ pointerEvents: "none" }}>
            <div
              className={cn(
                "whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold shadow-lg",
                urgent
                  ? "border-amber-400/80 bg-amber-950/90 text-amber-200"
                  : "border-sky-400/60 bg-[#10141b]/90 text-sky-200",
              )}
            >
              📦 {waiting.length} waiting{urgent ? " · urgent" : ""}
            </div>
          </Html>
        );
      })}

      {DROPOFFS.map((cell, i) => {
        const hit = recentDeliveries.find((e) => e.cell && same(e.cell, cell));
        if (!hit) return null;
        const [x, z] = gridToWorld(cell.x, cell.y);
        const age = (now - hit.t) / FLASH_SECONDS;
        const taskId = hit.message.match(/\bT\d+\b/)?.[0] ?? "";
        return (
          <group key={`drop-${i}`} position={[x, 0, z]}>
            <mesh rotation-x={-Math.PI / 2} position-y={0.05} scale={1 + age * 0.6}>
              <ringGeometry args={[0.9, 1.15, 32]} />
              <meshBasicMaterial color="#34d399" transparent opacity={0.85 * (1 - age)} />
            </mesh>
            <Html position={[0, 1.6, 0]} center style={{ pointerEvents: "none" }}>
              <div
                className="whitespace-nowrap rounded-full border border-emerald-400/70 bg-emerald-950/90 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-200 shadow-lg"
                style={{ opacity: 1 - age * 0.7 }}
              >
                ✓ Delivered {taskId}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

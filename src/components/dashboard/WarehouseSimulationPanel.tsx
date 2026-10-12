import { CheckCircle2, ChevronRight, Construction, Focus, Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SimCanvas } from "@/components/warehouse/SimCanvas";
import { cn } from "@/lib/utils";
import { SCENARIOS } from "@/sim/engine";
import { useSimStore } from "@/sim/store";
import { AmrHud } from "./AmrHud";
import { CameraToolbar } from "./CameraToolbar";
import { MiniMap } from "./MiniMap";
import { Panel } from "./Panel";
import { DEMO_AISLE_X, useSimActions } from "./useSimActions";

/* Colours below mirror what the Three.js scene actually paints (Warehouse.tsx / Overlays.tsx). */
const LEGEND = [
  { label: "AMR robot", swatch: "bg-[#ffaa00]", shape: "rounded-sm" },
  { label: "Storage racks", swatch: "bg-[#47505c]", shape: "rounded-sm" },
  { label: "Pickup station", swatch: "bg-[#3d7fd6]", shape: "rounded-sm" },
  { label: "Drop-off station", swatch: "bg-[#2f9e6a]", shape: "rounded-sm" },
  { label: "Charger", swatch: "bg-[#39d98a]", shape: "rounded-sm" },
  { label: "Worker / pallet", swatch: "bg-[#f5f13a]", shape: "rounded-full" },
  { label: "Blocked aisle", swatch: "bg-[#ff5a1f]", shape: "rounded-full" },
  { label: "Planned path", swatch: "bg-[#38bdf8]", shape: "rounded-full" },
] as const;

export function WarehouseSimulationPanel() {
  const snap = useSimStore((s) => s.snap);
  const showPaths = useSimStore((s) => s.showPaths);
  const setCameraMode = useSimStore((s) => s.setCameraMode);
  const actions = useSimActions();
  const meta = SCENARIOS.find((s) => s.id === snap.scenario);
  const aisleBlocked = snap.blockedCells.length > 0;
  const steps = snap.narrative.steps;

  return (
    <Panel
      title="Live Warehouse Simulation"
      description={meta ? `Scenario ${meta.id} · ${meta.name} — ${meta.blurb}` : undefined}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={actions.addTask}>
                <Plus />
                Add Task
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Create a random pickup → drop-off job for the fleet to allocate
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={actions.addObstacle}>
                <TriangleAlert />
                Add Obstacle
              </Button>
            </TooltipTrigger>
            <TooltipContent>Drop a worker or pallet ahead of a moving robot</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={actions.toggleAisle}
                className={cn(
                  aisleBlocked && "border-signal-fail/40 bg-signal-fail-soft text-signal-fail",
                )}
              >
                <Construction />
                {aisleBlocked ? `Reopen Aisle ${DEMO_AISLE_X}` : `Block Aisle ${DEMO_AISLE_X}`}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close a corridor so robots have to re-plan their routes</TooltipContent>
          </Tooltip>
        </div>
      }
    >
      {/* Scenario progress (driven by the engine's narrative) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b bg-panel-raised px-4 py-2 text-xs">
        <span
          className="min-w-0 flex-1 truncate text-foreground"
          title={snap.narrative.currentLiner}
        >
          {snap.narrative.currentLiner}
        </span>
        {steps.length > 0 && (
          <ol className="flex flex-wrap items-center gap-1" aria-label="Scenario steps">
            {steps.map((step, i) => (
              <li key={step.id} className="flex items-center gap-1">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] leading-4",
                    step.status === "completed" &&
                      "border-signal-ok/20 bg-signal-ok-soft text-signal-ok",
                    step.status === "active" &&
                      "border-primary/30 bg-accent font-medium text-accent-foreground",
                    step.status === "pending" && "border-border text-muted-foreground",
                  )}
                >
                  {step.status === "completed" ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <span>{step.id}.</span>
                  )}
                  {step.label}
                </span>
                {i < steps.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* The 3D viewport: dark on purpose, it is the warehouse scene itself. */}
      <div className="relative h-[62vh] min-h-[420px] w-full overflow-hidden bg-[#141820]">
        <SimCanvas />
        <div className="pointer-events-none absolute bottom-12 left-3 rounded-md bg-black/55 px-2.5 py-1 text-[11px] text-white/85 backdrop-blur-sm">
          Orbit: drag · Pan: right-drag · Zoom: scroll · Click an AMR to select it
        </div>
        <CameraToolbar />
        <AmrHud />
        <MiniMap />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setCameraMode("overview");
            actions.resetCamera();
          }}
          className="absolute bottom-3 left-3 h-7 bg-white/90 px-2 text-xs text-foreground shadow hover:bg-white"
        >
          <Focus />
          Reset Camera
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t px-4 py-2 text-[11px] text-muted-foreground">
        {LEGEND.map((item) => (
          <span
            key={item.label}
            className={cn(
              "flex items-center gap-1.5",
              item.label === "Planned path" && !showPaths && "opacity-40",
            )}
          >
            <span
              className={cn(
                "inline-block h-2.5 w-2.5 border border-black/10",
                item.swatch,
                item.shape,
              )}
            />
            {item.label}
            {item.label === "Planned path" && !showPaths && " (hidden)"}
          </span>
        ))}
      </div>
    </Panel>
  );
}

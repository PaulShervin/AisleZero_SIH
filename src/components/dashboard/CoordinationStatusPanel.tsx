import { useState } from "react";
import { ChevronDown, CircleCheck, Info, ShieldAlert, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSimStore } from "@/sim/store";
import type { ConflictRecord, ScenarioNarrative } from "@/sim/types";
import { Panel, StatusBadge } from "./Panel";
import { TONE_BADGE, type Tone } from "./sim-labels";

const CONFLICT_SCENARIO_ID = 4;

const ALERT_TONE: Record<NonNullable<ScenarioNarrative["alert"]>["type"], Tone> = {
  info: "info",
  warning: "warn",
  danger: "fail",
  success: "ok",
};

const PHASE_LABEL: Record<ConflictRecord["phase"], string> = {
  detected: "Detected",
  diverting: "Taking side path",
  resolved: "Resolved",
};

/*
 * What the engine actually does today (see src/sim/engine.ts). Keep this list
 * honest: it is shown to judges as the implemented behaviour.
 */
const MECHANISMS = [
  {
    title: "Task allocation",
    text: "Pending tasks are scored for every available robot by distance to pickup, remaining battery, current workload and task urgency; the lowest score wins.",
  },
  {
    title: "Path planning & rerouting",
    text: "Each robot plans an A* route through the aisles. Blocked aisles, parked obstacles and stopped robots trigger an immediate re-plan.",
  },
  {
    title: "Conflict resolution",
    text: "When two robots head for the same cell, priority (urgency, cargo, battery) decides who proceeds; the other waits or takes a side path.",
  },
  {
    title: "Obstacle avoidance",
    text: "Robots stop short of workers and pallets detected on their route, then detour around them.",
  },
  {
    title: "Failure handling",
    text: "A faulted robot performs an emergency stop. Its open task returns to the queue and is reallocated; nearby robots re-plan around it.",
  },
] as const;

export function CoordinationStatusPanel() {
  const snap = useSimStore((s) => s.snap);
  const [showHow, setShowHow] = useState(false);
  const active = snap.conflicts.filter((c) => !c.resolved);
  const resolved = snap.conflicts.filter((c) => c.resolved);
  const alert = snap.narrative.alert;

  return (
    <Panel title="Coordination" description="How the robots are sharing the floor right now">
      <div className="space-y-3 p-4">
        {alert && (
          <div
            className={cn(
              "flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
              TONE_BADGE[ALERT_TONE[alert.type]],
            )}
          >
            {alert.type === "success" ? (
              <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <div>
              <div className="font-semibold">{alert.title}</div>
              <div className="opacity-90">{alert.text}</div>
            </div>
          </div>
        )}

        {active.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border bg-panel-raised px-3 py-2 text-xs text-foreground">
            <CircleCheck className="h-4 w-4 text-signal-ok" />
            No active conflicts detected
          </div>
        ) : (
          <ul className="space-y-2">
            {active.map((c) => (
              <ConflictRow key={c.id} conflict={c} />
            ))}
          </ul>
        )}

        {resolved.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            {resolved.length} conflict{resolved.length === 1 ? "" : "s"} resolved this run.
          </p>
        )}

        {snap.scenario !== CONFLICT_SCENARIO_ID && (
          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Detailed conflict tracking is recorded in Scenario 4 · Conflict Resolution. Other
            scenarios resolve right-of-way silently and log it in Activity.
          </p>
        )}

        <button
          type="button"
          onClick={() => setShowHow((v) => !v)}
          aria-expanded={showHow}
          className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-xs font-medium text-foreground hover:bg-panel-raised"
        >
          How coordination works
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              showHow && "rotate-180",
            )}
          />
        </button>
        {showHow && (
          <div className="space-y-2.5 text-xs">
            {MECHANISMS.map((m) => (
              <div key={m.title}>
                <div className="font-semibold text-foreground">{m.title}</div>
                <p className="text-muted-foreground">{m.text}</p>
              </div>
            ))}
            <p className="border-t pt-2 text-[11px] text-muted-foreground">
              All decisions run inside the in-browser simulation engine; peer-to-peer messaging
              between real robots is not part of this demo.
            </p>
          </div>
        )}
      </div>
    </Panel>
  );
}

function ConflictRow({ conflict }: { conflict: ConflictRecord }) {
  const tone: Tone = conflict.phase === "diverting" ? "warn" : "fail";
  return (
    <li className="rounded-md border px-3 py-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <ShieldAlert className="h-3.5 w-3.5 text-signal-fail" />
          {conflict.yielding} yields to {conflict.proceeding}
        </span>
        <StatusBadge tone={tone}>{PHASE_LABEL[conflict.phase]}</StatusBadge>
      </div>
      <p className="mt-1 text-muted-foreground">
        Near cell ({conflict.cell.x}, {conflict.cell.y}) · {conflict.reason}
      </p>
    </li>
  );
}

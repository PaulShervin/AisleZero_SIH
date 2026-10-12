import type { ComponentType } from "react";
import { Bot, CheckCircle2, ClipboardList, HeartPulse, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSimStore } from "@/sim/store";
import { TONE_BADGE, type Tone } from "./sim-labels";

interface Kpi {
  label: string;
  value: string;
  hint: string;
  tone: Tone;
  icon: ComponentType<{ className?: string }>;
}

export function FleetKpiCards() {
  const snap = useSimStore((s) => s.snap);

  const operational = snap.robots.filter((r) => r.status !== "failed");
  const failed = snap.robots.length - operational.length;
  const activeTasks = snap.tasks.filter((t) => t.status !== "done");
  const completed = snap.tasks.filter((t) => t.status === "done");
  const activeConflicts = snap.conflicts.filter((c) => !c.resolved);

  const kpis: Kpi[] = [
    {
      label: "Active Robots",
      value: `${operational.length} / ${snap.robots.length}`,
      hint: failed > 0 ? `${failed} stopped by fault` : "All robots operational",
      tone: failed > 0 ? "fail" : "ok",
      icon: Bot,
    },
    {
      label: "Active Tasks",
      value: String(activeTasks.length),
      hint: `${snap.tasks.filter((t) => t.status === "pending").length} waiting for a robot`,
      tone: "info",
      icon: ClipboardList,
    },
    {
      label: "Tasks Completed",
      value: String(completed.length),
      hint: "Deliveries finished this run",
      tone: "ok",
      icon: CheckCircle2,
    },
    {
      label: "Active Conflicts",
      value: String(activeConflicts.length),
      hint: activeConflicts.length > 0 ? "Robots negotiating right of way" : "No route conflicts",
      tone: activeConflicts.length > 0 ? "warn" : "idle",
      icon: TriangleAlert,
    },
    {
      label: "Fleet Health",
      value: failed > 0 ? "Degraded" : "Healthy",
      hint: `${operational.length} of ${snap.robots.length} robots available`,
      tone: failed > 0 ? "fail" : "ok",
      icon: HeartPulse,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {kpis.map((k) => (
        <div key={k.label} className="panel flex items-center gap-3 px-4 py-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
              TONE_BADGE[k.tone],
            )}
          >
            <k.icon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-semibold leading-tight tabular-nums text-foreground">
              {k.value}
            </div>
            <div className="text-xs font-medium text-foreground/80">{k.label}</div>
            <div className="truncate text-[11px] text-muted-foreground">{k.hint}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

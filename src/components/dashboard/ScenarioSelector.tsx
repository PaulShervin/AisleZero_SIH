import { Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SCENARIOS } from "@/sim/engine";
import { useSimStore } from "@/sim/store";
import { Panel, StatusBadge } from "./Panel";
import { useSimActions } from "./useSimActions";

export function ScenarioSelector() {
  const current = useSimStore((s) => s.snap.scenario);
  const actions = useSimActions();

  return (
    <Panel
      title="Scenarios"
      description={`${SCENARIOS.length} demonstrations of the coordination behaviour`}
      bodyClassName="divide-y"
    >
      {SCENARIOS.map((s) => {
        const active = s.id === current;
        return (
          <div
            key={s.id}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5",
              active ? "bg-accent/60" : "hover:bg-panel-raised",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-mono text-[11px] font-semibold",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {String(s.id).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{s.name}</span>
                {active && <StatusBadge tone="info">Running</StatusBadge>}
              </div>
              <p className="truncate text-[11px] text-muted-foreground" title={s.blurb}>
                {s.blurb}
              </p>
            </div>
            <Button
              size="sm"
              variant={active ? "outline" : "secondary"}
              className="h-7 shrink-0 text-xs"
              onClick={() => actions.loadScenario(s.id)}
            >
              {active ? <RotateCcw /> : <Play />}
              {active ? "Restart" : "Run"}
            </Button>
          </div>
        );
      })}
    </Panel>
  );
}

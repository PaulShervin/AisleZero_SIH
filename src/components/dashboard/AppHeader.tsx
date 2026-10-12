import { Bot, Pause, Play, RotateCcw, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getSim, SCENARIOS } from "@/sim/engine";
import { useSimStore } from "@/sim/store";
import { StatusBadge } from "./Panel";
import { formatSimTime } from "./sim-labels";
import { useSimActions } from "./useSimActions";

const SPEEDS = [1, 2, 4] as const;

export function AppHeader() {
  const snap = useSimStore((s) => s.snap);
  const showPaths = useSimStore((s) => s.showPaths);
  const setShowPaths = useSimStore((s) => s.setShowPaths);
  const actions = useSimActions();
  const speed = getSim().speed;

  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1700px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight text-foreground">AisleZero</div>
            <div className="text-[11px] text-muted-foreground">
              Decentralized AMR Fleet Coordination
            </div>
          </div>
        </div>

        <div className="hidden h-7 w-px bg-border md:block" />

        {/* Status */}
        <div className="flex items-center gap-2">
          <StatusBadge tone={snap.running ? "ok" : "warn"}>
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                snap.running ? "bg-signal-ok" : "bg-signal-warn",
              )}
            />
            {snap.running ? "Running" : "Paused"}
          </StatusBadge>
          <span
            className="font-mono text-xs tabular-nums text-muted-foreground"
            title="Simulation clock"
          >
            {formatSimTime(snap.time)}
          </span>
        </div>

        {/* Controls */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Scenario</span>
            <select
              value={snap.scenario}
              onChange={(e) => actions.loadScenario(Number(e.target.value))}
              aria-label="Active scenario"
              className="h-8 max-w-[220px] rounded-md border border-input bg-card px-2 text-xs font-medium text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}. {s.name}
                </option>
              ))}
            </select>
          </label>

          <Button size="sm" onClick={actions.togglePlay} className="w-[88px]">
            {snap.running ? <Pause /> : <Play />}
            {snap.running ? "Pause" : "Resume"}
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={actions.reset}>
                <RotateCcw />
                Reset
              </Button>
            </TooltipTrigger>
            <TooltipContent>Restart the current scenario from the beginning</TooltipContent>
          </Tooltip>

          <div
            className="flex items-center rounded-md border border-input bg-card p-0.5"
            role="group"
            aria-label="Simulation speed"
          >
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => actions.setSpeed(s)}
                aria-pressed={speed === s}
                className={cn(
                  "h-7 rounded px-2.5 text-xs font-medium transition-colors",
                  speed === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s}×
              </button>
            ))}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPaths(!showPaths)}
                aria-pressed={showPaths}
                className={cn(showPaths && "border-primary/40 bg-accent text-accent-foreground")}
              >
                <Route />
                Show Paths
              </Button>
            </TooltipTrigger>
            <TooltipContent>Draw each robot's planned route on the warehouse floor</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}

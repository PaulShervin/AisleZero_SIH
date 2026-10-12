import { useState } from "react";
import { Battery, BatteryCharging, ChevronDown, Package, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSimStore } from "@/sim/store";
import type { Robot } from "@/sim/types";
import { amrColorById } from "@/sim/palette";
import { EmptyState, Panel, StatusBadge } from "./Panel";
import { ROBOT_STATUS, STATUS_ICON, TONE_DOT, batteryTone, stationLabel } from "./sim-labels";
import { useSimActions } from "./useSimActions";

export function RobotFleetPanel() {
  const robots = useSimStore((s) => s.snap.robots);
  const selected = useSimStore((s) => s.selected);
  const select = useSimStore((s) => s.select);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Panel
      title="Robot Fleet"
      description="Click a robot to highlight it in the warehouse"
      bodyClassName="divide-y"
    >
      {robots.length === 0 && <EmptyState>No robots in this scenario.</EmptyState>}
      {robots.map((robot) => (
        <RobotCard
          key={robot.id}
          robot={robot}
          selected={selected === robot.id}
          expanded={expanded === robot.id}
          onSelect={() => select(robot.id)}
          onToggleExpand={() => setExpanded((cur) => (cur === robot.id ? null : robot.id))}
        />
      ))}
    </Panel>
  );
}

interface RobotCardProps {
  robot: Robot;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}

function RobotCard({ robot, selected, expanded, onSelect, onToggleExpand }: RobotCardProps) {
  const actions = useSimActions();
  const robots = useSimStore((s) => s.snap.robots);
  const status = ROBOT_STATUS[robot.status];
  const StatusIcon = STATUS_ICON[robot.status];
  const color = amrColorById(robot.id);
  const holding = robot.holdingFor ? robots.find((r) => r.id === robot.holdingFor) : null;
  const battery = Math.round(robot.battery);
  const tone = batteryTone(robot.battery);
  const failed = robot.status === "failed";

  return (
    <div
      className={cn(
        "border-l-4 px-4 py-3 transition-colors",
        selected ? "bg-accent/60" : "hover:bg-panel-raised",
      )}
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border font-mono text-[11px] font-semibold"
            style={
              selected
                ? { background: color, borderColor: color, color: "#0b0e12" }
                : { borderColor: color, color }
            }
          >
            {robot.name.replace("AMR-", "")}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">{robot.name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {holding
                ? `Yielding to ${holding.name}`
                : robot.taskId
                  ? `Task ${robot.taskId}`
                  : "No task assigned"}
            </span>
          </span>
        </button>
        <StatusBadge tone={status.tone}>
          <StatusIcon
            className={cn("h-3 w-3", failed && "animate-pulse motion-reduce:animate-none")}
            aria-hidden="true"
          />
          {status.label}
        </StatusBadge>
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          aria-label={expanded ? "Hide details" : "Show details"}
          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
        </button>
      </div>

      {/* Battery + quick stats */}
      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-muted-foreground">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {robot.status === "charging" ? (
            <BatteryCharging className="h-3.5 w-3.5 shrink-0 text-signal-info" />
          ) : (
            <Battery className="h-3.5 w-3.5 shrink-0" />
          )}
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"
            role="meter"
            aria-valuenow={battery}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Battery"
          >
            <div
              className={cn("h-full rounded-full transition-[width]", TONE_DOT[tone])}
              style={{ width: `${Math.max(3, battery)}%` }}
            />
          </div>
          <span className="w-9 text-right font-mono tabular-nums text-foreground">{battery}%</span>
        </div>
        <span className="flex items-center gap-1" title="Cargo">
          {robot.carrying ? (
            <Package className="h-3.5 w-3.5 text-signal-ok" />
          ) : (
            <PackageOpen className="h-3.5 w-3.5" />
          )}
          {robot.carrying ? "Loaded" : "Empty"}
        </span>
        <span title="Completed deliveries">
          <span className="font-mono tabular-nums text-foreground">{robot.tasksDone}</span>{" "}
          delivered
        </span>
        <span title="Route re-plans">
          <span className="font-mono tabular-nums text-foreground">{robot.reroutes}</span> reroutes
        </span>
      </div>

      {expanded && (
        <div className="mt-3 rounded-md border bg-panel-raised p-3 text-xs">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <Detail
              label="Position"
              value={`(${robot.pos.x.toFixed(1)}, ${robot.pos.y.toFixed(1)})`}
            />
            <Detail label="Destination" value={robot.dest ? stationLabel(robot.dest) : "—"} />
            <Detail
              label="Waypoints left"
              value={String(Math.max(0, robot.path.length - robot.pathIndex))}
            />
            <Detail label="Distance travelled" value={`${robot.distance.toFixed(1)} cells`} />
            <Detail label="Conflicts met" value={String(robot.conflicts)} />
            <Detail label="Speed" value={`${robot.speed.toFixed(1)} cells/s`} />
          </dl>
          <p className="mt-2 border-t pt-2 text-muted-foreground">
            <span className="font-medium text-foreground">Last event:</span> {robot.lastEvent}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2">
            <span className="text-[11px] text-muted-foreground">Test action — simulation only</span>
            <Button
              size="sm"
              variant={failed ? "default" : "outline"}
              className={cn(
                "h-7 text-xs",
                !failed &&
                  "border-signal-fail/40 text-signal-fail hover:bg-signal-fail-soft hover:text-signal-fail",
              )}
              onClick={() =>
                failed ? actions.recoverRobot(robot.id) : actions.failRobot(robot.id)
              }
            >
              {failed ? "Recover Robot" : "Inject Fault"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

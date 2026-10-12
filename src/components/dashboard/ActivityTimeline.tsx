import { useState } from "react";
import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSimStore } from "@/sim/store";
import type { SimEvent } from "@/sim/types";
import { flyToCell } from "@/components/warehouse/camera";
import { EmptyState, Panel, StatusBadge } from "./Panel";
import { EVENT_ICON, EVENT_KIND, TONE_DOT, formatSimTime } from "./sim-labels";

const COMPACT_COUNT = 8;

/** Latest-first feed of the engine's own event log. Messages are shown verbatim. */
export function ActivityTimeline() {
  const events = useSimStore((s) => s.snap.events);
  const select = useSimStore((s) => s.select);
  const setFocus = useSimStore((s) => s.setFocus);
  const [showAll, setShowAll] = useState(false);

  const jumpTo = (ev: SimEvent) => {
    if (!ev.cell) return;
    flyToCell(ev.cell);
    setFocus({ cell: ev.cell, label: ev.message, at: Date.now() });
    if (ev.robotId) select(ev.robotId);
  };
  const visible = showAll ? events : events.slice(0, COMPACT_COUNT);

  return (
    <Panel
      title="Activity"
      description="What the fleet is doing, newest first. Click an event to jump to it."
      actions={
        events.length > COMPACT_COUNT ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Show fewer" : `Show all (${events.length})`}
          </Button>
        ) : undefined
      }
    >
      {events.length === 0 ? (
        <EmptyState>No events logged yet.</EmptyState>
      ) : (
        <ol className={cn("divide-y", showAll && "max-h-[420px] overflow-y-auto")}>
          {visible.map((ev) => {
            const kind = EVENT_KIND[ev.kind];
            const Icon = EVENT_ICON[ev.kind];
            const canJump = Boolean(ev.cell);
            return (
              <li key={ev.id}>
                <button
                  type="button"
                  disabled={!canJump}
                  onClick={() => jumpTo(ev)}
                  title={canJump ? "Show this in the warehouse" : undefined}
                  className={cn(
                    "group flex w-full items-start gap-2.5 px-4 py-2 text-left text-xs",
                    canJump ? "hover:bg-panel-raised" : "cursor-default",
                  )}
                >
                  <span
                    className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", TONE_DOT[kind.tone])}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={kind.tone}>
                        <Icon className="h-3 w-3" aria-hidden="true" />
                        {kind.label}
                      </StatusBadge>
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        +{formatSimTime(ev.t)}
                      </span>
                      {canJump && (
                        <Crosshair className="ml-auto h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </div>
                    <p className="mt-0.5 break-words leading-snug text-foreground">{ev.message}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}

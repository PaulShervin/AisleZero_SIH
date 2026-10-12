import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSimStore } from "@/sim/store";
import { amrColorById } from "@/sim/palette";
import { EmptyState, Panel, StatusBadge } from "./Panel";
import { PRIORITY, TASK_STATUS, stationLabel } from "./sim-labels";
import { useSimActions } from "./useSimActions";

export function TaskManagementPanel() {
  const tasks = useSimStore((s) => s.snap.tasks);
  const robots = useSimStore((s) => s.snap.robots);
  const actions = useSimActions();
  const robotName = (id: string | null) => robots.find((r) => r.id === id)?.name ?? "Unassigned";
  const open = tasks.filter((t) => t.status !== "done").length;

  return (
    <Panel
      title="Tasks"
      description={
        tasks.length > 0
          ? `${open} open · ${tasks.length - open} completed`
          : "Pickup and delivery jobs for the fleet"
      }
      actions={
        <Button size="sm" onClick={actions.addTask}>
          <Plus />
          Add Task
        </Button>
      }
      bodyClassName="overflow-x-auto"
    >
      {tasks.length === 0 ? (
        <EmptyState>No tasks yet. Use “Add Task” to create a pickup → drop-off job.</EmptyState>
      ) : (
        <table className="w-full text-left text-xs">
          <thead className="label-xs border-b bg-panel-raised">
            <tr>
              <th className="px-4 py-2 font-semibold">Task</th>
              <th className="px-2 py-2 font-semibold">Route</th>
              <th className="px-2 py-2 font-semibold">Robot</th>
              <th className="px-2 py-2 font-semibold">Priority</th>
              <th className="px-4 py-2 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.map((task) => {
              const status = TASK_STATUS[task.status];
              const priority = PRIORITY[task.urgency] ?? {
                label: `Level ${task.urgency}`,
                tone: "idle" as const,
              };
              return (
                <tr key={task.id} className="hover:bg-panel-raised">
                  <td className="px-4 py-2 font-mono font-semibold text-foreground">
                    {task.id}
                    {task.reassignments > 0 && (
                      <span
                        className="ml-1.5 font-sans text-[10px] font-medium text-signal-warn"
                        title="Reassigned after a robot fault"
                      >
                        reassigned ×{task.reassignments}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">
                    <span className="text-foreground">{stationLabel(task.pickup)}</span>
                    <ArrowRight className="mx-1 inline h-3 w-3" />
                    <span className="text-foreground">{stationLabel(task.dropoff)}</span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-foreground">
                    {task.allocation && task.assignedTo ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex cursor-help items-center gap-1.5 underline decoration-dotted underline-offset-2">
                            <span
                              className="h-2 w-2 rounded-sm"
                              style={{ background: amrColorById(task.assignedTo) }}
                            />
                            {robotName(task.assignedTo)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[260px] font-mono text-[11px]">
                          <div className="font-semibold">
                            Why {robotName(task.assignedTo)}? score{" "}
                            {task.allocation.score.toFixed(1)}
                          </div>
                          <div className="mt-1 text-[10.5px] opacity-90">
                            distance {task.allocation.dist} · battery {task.allocation.battery}% ·
                            load {task.allocation.load} · urgency {task.allocation.urgency}
                          </div>
                          {task.allocation.alternatives.length > 0 && (
                            <div className="mt-1 text-[10.5px] opacity-75">
                              others:{" "}
                              {task.allocation.alternatives
                                .map((a) => `${robotName(a.robotId)} ${a.score.toFixed(1)}`)
                                .join(", ")}
                            </div>
                          )}
                          <div className="mt-1 text-[10px] opacity-60">lower score wins</div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      robotName(task.assignedTo)
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <StatusBadge tone={priority.tone}>{priority.label}</StatusBadge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

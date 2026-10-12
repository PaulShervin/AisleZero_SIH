import { useMemo } from "react";
import { toast } from "sonner";
import { getSim, SCENARIOS } from "@/sim/engine";
import { useSimStore } from "@/sim/store";
import { resetCamera } from "@/components/warehouse/camera";
import { stationLabel } from "./sim-labels";

/** The aisle column the demo "block aisle" control toggles (unchanged from the original UI). */
export const DEMO_AISLE_X = 14;

/**
 * Every UI command goes through the engine singleton, then refreshes the
 * snapshot so panels update immediately instead of waiting for the next tick.
 */
export function useSimActions() {
  const refresh = useSimStore((s) => s.refresh);

  return useMemo(() => {
    const sim = () => getSim();
    const done = () => refresh();

    return {
      togglePlay() {
        if (sim().running) sim().pause();
        else sim().resume();
        done();
      },
      reset() {
        sim().reset();
        sim().start();
        done();
        toast.info("Simulation reset", {
          description: "Robots and tasks returned to their starting state.",
        });
      },
      loadScenario(id: number) {
        sim().loadScenario(id);
        sim().start();
        done();
        const meta = SCENARIOS.find((s) => s.id === id);
        toast.success(`Scenario ${id} started`, { description: meta?.name });
      },
      setSpeed(v: number) {
        sim().setSpeed(v);
        done();
      },
      addTask() {
        const task = sim().addRandomTask();
        done();
        toast.success(`Task ${task.id} created`, {
          description: `${stationLabel(task.pickup)} → ${stationLabel(task.dropoff)}`,
        });
      },
      addObstacle() {
        const before = sim().obstacles.length;
        sim().addObstacleNearFleet();
        done();
        const added = sim().obstacles[sim().obstacles.length - 1];
        if (sim().obstacles.length > before && added) {
          toast.warning(`${added.kind === "worker" ? "Worker" : "Pallet"} placed on the floor`, {
            description: `Near cell (${added.pos.x}, ${added.pos.y}) — robots must detect and avoid it.`,
          });
        }
      },
      toggleAisle() {
        sim().toggleAisle(DEMO_AISLE_X);
        done();
        const blocked = sim().blocked.size > 0;
        if (blocked) {
          toast.warning(`Aisle ${DEMO_AISLE_X} blocked`, {
            description: "Affected robots are re-planning their routes.",
          });
        } else {
          toast.info(`Aisle ${DEMO_AISLE_X} reopened`);
        }
      },
      failRobot(id: string) {
        sim().failRobot(id);
        done();
        const r = sim().robots.find((x) => x.id === id);
        toast.error(`${r?.name ?? id} fault injected`, {
          description: "Emergency stop engaged. Any open task is returned to the queue.",
        });
      },
      recoverRobot(id: string) {
        sim().recoverRobot(id);
        done();
        const r = sim().robots.find((x) => x.id === id);
        toast.success(`${r?.name ?? id} recovered`, {
          description: "Back online and available for tasks.",
        });
      },
      resetCamera() {
        resetCamera();
      },
    };
  }, [refresh]);
}

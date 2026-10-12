import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { AppHeader } from "@/components/dashboard/AppHeader";
import { CoordinationStatusPanel } from "@/components/dashboard/CoordinationStatusPanel";
import { FleetKpiCards } from "@/components/dashboard/FleetKpiCards";
import { RobotFleetPanel } from "@/components/dashboard/RobotFleetPanel";
import { ScenarioSelector } from "@/components/dashboard/ScenarioSelector";
import { TaskManagementPanel } from "@/components/dashboard/TaskManagementPanel";
import { WarehouseSimulationPanel } from "@/components/dashboard/WarehouseSimulationPanel";
import { getSim } from "@/sim/engine";
import { useSimStore } from "@/sim/store";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  // The Three.js canvas and the engine singleton are browser-only; render them after hydration.
  const [mounted, setMounted] = useState(false);
  const refresh = useSimStore((s) => s.refresh);

  useEffect(() => {
    setMounted(true);
    const sim = getSim();
    if (!sim.running) sim.start();
    refresh();
  }, [refresh]);

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm">Loading warehouse simulation…</span>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={250}>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader />
        <main className="mx-auto max-w-[1700px] space-y-4 px-4 py-4">
          <FleetKpiCards />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0 space-y-4">
              <WarehouseSimulationPanel />
              <div className="grid gap-4 2xl:grid-cols-2">
                <TaskManagementPanel />
                <ScenarioSelector />
              </div>
            </div>
            <div className="min-w-0 space-y-4">
              <RobotFleetPanel />
              <CoordinationStatusPanel />
              <ActivityTimeline />
            </div>
          </div>
        </main>
        <Toaster position="bottom-right" richColors closeButton />
      </div>
    </TooltipProvider>
  );
}

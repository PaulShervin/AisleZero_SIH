import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TONE_BADGE, type Tone } from "./sim-labels";

interface PanelProps {
  title: string;
  description?: string | undefined;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/** Consistent white card with a slim header row. */
export function Panel({
  title,
  description,
  actions,
  className,
  bodyClassName,
  children,
}: PanelProps) {
  return (
    <section className={cn("panel flex min-w-0 flex-col", className)}>
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b px-4 py-3">
        <div className="min-w-0 flex-1 basis-[220px]">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex min-w-0 max-w-full items-center gap-2">{actions}</div>}
      </header>
      <div className={cn("min-w-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4",
        TONE_BADGE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center px-4 py-8 text-center text-xs text-muted-foreground">
      {children}
    </div>
  );
}

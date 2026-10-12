// One colour per AMR, used everywhere the robot is shown: body, route, tag,
// fleet card, toolbar and minimap. Keep this the single source of truth.

export const AMR_COLORS = ["#f2a417", "#2fa8ff", "#ff5fa2"] as const;

export function amrIndex(id: string): number {
  return Number(id.slice(1)) - 1;
}

export function amrColor(index: number): string {
  return AMR_COLORS[((index % AMR_COLORS.length) + AMR_COLORS.length) % AMR_COLORS.length]!;
}

export function amrColorById(id: string): string {
  return amrColor(amrIndex(id));
}

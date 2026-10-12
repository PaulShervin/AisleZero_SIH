// Building envelope around the navigation grid. The grid itself is untouched:
// every decorative object lives in the margin band outside the drivable cells,
// so robots never clip through scenery.
import { CELL, WAREHOUSE_DEPTH, WAREHOUSE_WIDTH } from "@/sim/grid";

/** Extra floor beyond the grid on each side (x) and each end (z), in metres. */
export const MARGIN_X = 3 * CELL;
export const MARGIN_Z = 2.5 * CELL;

export const BUILDING_W = WAREHOUSE_WIDTH + MARGIN_X * 2;
export const BUILDING_D = WAREHOUSE_DEPTH + MARGIN_Z * 2;
export const BUILDING_H = 16;

/** Drivable half-extents in world units. */
export const GRID_HALF_W = WAREHOUSE_WIDTH / 2;
export const GRID_HALF_D = WAREHOUSE_DEPTH / 2;

export const COLOR = {
  upright: "#1f4f9c",
  beam: "#e4701b",
  steel: "#3b424b",
  steelDark: "#2a3038",
  concreteTrim: "#6f747a",
  marking: "#e5c62e",
  bollard: "#f2b51c",
} as const;

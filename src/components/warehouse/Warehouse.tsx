import { Building } from "./Building";
import { FloorMarkings } from "./FloorMarkings";
import { Racks } from "./Racks";
import { Zones } from "./Zones";

/**
 * Static warehouse scenery. Everything here is decoration: the drivable area is
 * still defined only by src/sim/grid.ts, and nothing is placed on a drivable
 * cell except the stations and chargers that the engine already routes to.
 */
export function Warehouse() {
  return (
    <group>
      <Building />
      <FloorMarkings />
      <Racks />
      <Zones />
    </group>
  );
}

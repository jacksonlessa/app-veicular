import type { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import type { Maintenance } from "@/domain/maintenance/entities/maintenance.entity";
import type { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";

/**
 * Returns the new `currentOdometer` for the vehicle after a maintenance mutation.
 * Takes the max across all fuelups and remaining maintenances (those with odometer set),
 * falling back to `vehicle.initOdometer` when no records have odometer values.
 */
export function computeMaintenanceOdometer(
  fuelups: Fuelup[],
  maintenances: Maintenance[],
  vehicle: Vehicle,
): number {
  const values: number[] = [vehicle.initOdometer.value];

  for (const f of fuelups) {
    values.push(f.odometer.value);
  }

  for (const m of maintenances) {
    if (m.odometer) {
      values.push(m.odometer.value);
    }
  }

  return Math.max(...values);
}

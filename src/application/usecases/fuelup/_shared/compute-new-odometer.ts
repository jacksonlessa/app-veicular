import type { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import type { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";

/**
 * Returns the new `currentOdometer` for the vehicle after a chain mutation.
 * If the chain is empty, falls back to `vehicle.initOdometer`.
 */
export function computeNewOdometer(chain: Fuelup[], vehicle: Vehicle): number {
  if (chain.length === 0) return vehicle.initOdometer.value;
  return Math.max(...chain.map((f) => f.odometer.value));
}

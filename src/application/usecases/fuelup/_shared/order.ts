import { Fuelup } from "@/domain/fuel/entities/fuelup.entity";

/**
 * Canonical ordering for a fuelup chain: date ASC, odometer ASC, createdAt ASC.
 */
export function byCanonicalOrder(a: Fuelup, b: Fuelup): number {
  const dateDiff = a.date.value.getTime() - b.date.value.getTime();
  if (dateDiff !== 0) return dateDiff;
  const odometerDiff = a.odometer.value - b.odometer.value;
  if (odometerDiff !== 0) return odometerDiff;
  return a.createdAt.getTime() - b.createdAt.getTime();
}

/**
 * Computes the new `currentOdometer` for a vehicle after a maintenance mutation.
 *
 * Considers all fuelup odometers, all maintenance odometers (excluding nulls),
 * the new odometer being saved, and the vehicle's initOdometer.
 *
 * Returns `undefined` when there are no odometer candidates (i.e., the new
 * maintenance has no odometer and no other records have one either).
 */
export function computeNewOdometer(params: {
  fuelupOdometers: number[];
  maintenanceOdometers: (number | null)[];
  newOdometer: number | undefined;
  initOdometer: number;
}): number | undefined {
  const candidates = [
    ...params.fuelupOdometers,
    ...params.maintenanceOdometers.filter((o): o is number => o !== null),
    ...(params.newOdometer !== undefined ? [params.newOdometer] : []),
  ];
  if (candidates.length === 0) return undefined;
  return Math.max(...candidates, params.initOdometer);
}

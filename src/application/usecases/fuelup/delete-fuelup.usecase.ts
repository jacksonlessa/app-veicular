import type { FuelupRepository } from "@/domain/fuel/repositories/fuelup.repository";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import type { TransactionRunner } from "@/application/ports/transaction-runner";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { recalculateChain } from "./_shared/recalculate-chain";
import { byCanonicalOrder } from "./_shared/order";
import { computeNewOdometer } from "./_shared/compute-new-odometer";

export interface DeleteFuelupInput {
  accountId: string;
  fuelupId: string;
}

export class DeleteFuelupUseCase {
  constructor(
    private readonly fuelups: FuelupRepository,
    private readonly vehicles: VehicleRepository,
    private readonly txRunner: TransactionRunner,
  ) {}

  async execute(input: DeleteFuelupInput): Promise<void> {
    const fuelup = await this.fuelups.findById(input.fuelupId);
    if (!fuelup) throw new BusinessRuleError("fuelup.not_found");

    const vehicle = await this.vehicles.findById(fuelup.vehicleId);
    if (!vehicle) throw new BusinessRuleError("vehicle.not_found");
    if (vehicle.accountId !== input.accountId)
      throw new BusinessRuleError("vehicle.not_owned");

    // Remove deleted fuelup from the chain and recalculate
    const all = await this.fuelups.findByVehicle(fuelup.vehicleId);
    const chain = all.filter((f) => f.id !== fuelup.id).sort(byCanonicalOrder);
    const recomputed = recalculateChain(chain);

    const newCurrentOdometer = computeNewOdometer(recomputed, vehicle);

    await this.txRunner.deleteFuelup({
      fuelupId: fuelup.id,
      recomputed: recomputed.map((f) => ({
        id: f.id,
        kmPerLiter: f.kmPerLiter?.value ?? null,
      })),
      vehicleId: vehicle.id,
      newCurrentOdometer,
    });
  }
}

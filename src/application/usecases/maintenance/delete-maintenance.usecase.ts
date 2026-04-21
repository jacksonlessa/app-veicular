import type { MaintenanceRepository } from "@/domain/maintenance/repositories/maintenance.repository";
import type { FuelupRepository } from "@/domain/fuel/repositories/fuelup.repository";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import type { TransactionRunner } from "@/application/ports/transaction-runner";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { computeMaintenanceOdometer } from "./_shared/compute-maintenance-odometer";

export interface DeleteMaintenanceInput {
  id: string;
  accountId: string;
}

export class DeleteMaintenanceUseCase {
  constructor(
    private readonly maintenances: MaintenanceRepository,
    private readonly fuelups: FuelupRepository,
    private readonly vehicles: VehicleRepository,
    private readonly txRunner: TransactionRunner,
  ) {}

  async execute(input: DeleteMaintenanceInput): Promise<void> {
    const maintenance = await this.maintenances.findById(input.id);
    if (!maintenance) throw new BusinessRuleError("maintenance.not_found");

    const vehicle = await this.vehicles.findById(maintenance.vehicleId);
    if (!vehicle) throw new BusinessRuleError("vehicle.not_found");
    if (vehicle.accountId !== input.accountId)
      throw new BusinessRuleError("vehicle.not_owned");

    const hasOdometer = maintenance.odometer !== undefined && maintenance.odometer !== null;

    if (!hasOdometer) {
      await this.txRunner.deleteMaintenance({
        maintenanceId: maintenance.id,
        vehicleId: vehicle.id,
        recalculateOdometer: false,
      });
      return;
    }

    const [allFuelups, allMaintenances] = await Promise.all([
      this.fuelups.findByVehicle(vehicle.id),
      this.maintenances.findByVehicle(vehicle.id),
    ]);

    const remainingMaintenances = allMaintenances.filter((m) => m.id !== maintenance.id);
    const newCurrentOdometer = computeMaintenanceOdometer(allFuelups, remainingMaintenances, vehicle);

    await this.txRunner.deleteMaintenance({
      maintenanceId: maintenance.id,
      vehicleId: vehicle.id,
      recalculateOdometer: true,
      newCurrentOdometer,
    });
  }
}

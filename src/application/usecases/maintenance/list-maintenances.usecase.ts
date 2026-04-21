import type { MaintenanceRepository } from "@/domain/maintenance/repositories/maintenance.repository";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import type { MaintenanceDTO } from "@/application/dtos/maintenance.dto";
import { toMaintenanceDTO } from "@/application/dtos/maintenance.dto";

export interface ListMaintenancesInput {
  vehicleId: string;
  accountId: string;
}

export type ListMaintenancesOutput = MaintenanceDTO[];

export class ListMaintenancesUseCase {
  constructor(
    private readonly maintenances: MaintenanceRepository,
    private readonly vehicles: VehicleRepository,
  ) {}

  async execute(input: ListMaintenancesInput): Promise<ListMaintenancesOutput> {
    const vehicle = await this.vehicles.findById(input.vehicleId);
    if (!vehicle) throw new BusinessRuleError("vehicle.not_found");
    if (vehicle.accountId !== input.accountId)
      throw new BusinessRuleError("vehicle.not_owned");

    const maintenances = await this.maintenances.findByVehicle(input.vehicleId);
    return maintenances.map(toMaintenanceDTO);
  }
}

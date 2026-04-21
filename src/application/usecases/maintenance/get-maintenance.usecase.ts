import type { MaintenanceRepository } from "@/domain/maintenance/repositories/maintenance.repository";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import type { MaintenanceDTO } from "@/application/dtos/maintenance.dto";
import { toMaintenanceDTO } from "@/application/dtos/maintenance.dto";

export interface GetMaintenanceInput {
  id: string;
  accountId: string;
}

export type GetMaintenanceOutput = MaintenanceDTO;

export class GetMaintenanceUseCase {
  constructor(
    private readonly maintenances: MaintenanceRepository,
    private readonly vehicles: VehicleRepository,
  ) {}

  async execute(input: GetMaintenanceInput): Promise<GetMaintenanceOutput> {
    const maintenance = await this.maintenances.findById(input.id);
    if (!maintenance) throw new BusinessRuleError("maintenance.not_found");

    const vehicle = await this.vehicles.findById(maintenance.vehicleId);
    if (!vehicle || vehicle.accountId !== input.accountId)
      throw new BusinessRuleError("vehicle.not_owned");

    return toMaintenanceDTO(maintenance);
  }
}

import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";

export interface DeleteVehicleInput {
  vehicleId: string;
  accountId: string;
}

export class DeleteVehicleUseCase {
  constructor(private readonly repository: VehicleRepository) {}

  async execute(input: DeleteVehicleInput): Promise<void> {
    const vehicle = await this.repository.findById(input.vehicleId);
    if (!vehicle) {
      throw new BusinessRuleError("vehicle.not_found");
    }
    if (vehicle.accountId !== input.accountId) {
      throw new BusinessRuleError("vehicle.not_found");
    }

    await this.repository.delete(input.vehicleId);
  }
}

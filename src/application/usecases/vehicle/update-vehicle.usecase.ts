import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";
import { Plate } from "@/domain/vehicle/value-objects/plate.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import type { VehicleDTO } from "@/application/dtos/vehicle.dto";

export interface UpdateVehicleInput {
  vehicleId: string;
  accountId: string;
  name?: string;
  plate?: string | null;
  currentOdometer?: number;
}

export interface UpdateVehicleOutput {
  vehicle: VehicleDTO;
}

export class UpdateVehicleUseCase {
  constructor(private readonly repository: VehicleRepository) {}

  async execute(input: UpdateVehicleInput): Promise<UpdateVehicleOutput> {
    const existing = await this.repository.findById(input.vehicleId);
    if (!existing) {
      throw new BusinessRuleError("vehicle.not_found");
    }
    if (existing.accountId !== input.accountId) {
      throw new BusinessRuleError("vehicle.not_found");
    }

    const name =
      input.name !== undefined
        ? VehicleName.create(input.name)
        : existing.name;

    const plate =
      input.plate !== undefined
        ? input.plate !== null
          ? Plate.create(input.plate)
          : null
        : existing.plate;

    const currentOdometer =
      input.currentOdometer !== undefined
        ? Odometer.create(input.currentOdometer)
        : existing.currentOdometer;

    const updated = Vehicle.rehydrate({
      id: existing.id,
      accountId: existing.accountId,
      name,
      plate,
      brand: existing.brand,
      model: existing.model,
      color: existing.color,
      initOdometer: existing.initOdometer,
      currentOdometer,
      createdAt: existing.createdAt,
    });

    await this.repository.update(updated);

    return {
      vehicle: {
        id: updated.id,
        name: updated.name.value,
        plate: updated.plate ? updated.plate.value : null,
        initOdometer: updated.initOdometer.value,
        currentOdometer: updated.currentOdometer.value,
        createdAt: updated.createdAt.toISOString(),
      },
    };
  }
}

import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import type { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import type { VehicleDTO } from "@/application/dtos/vehicle.dto";

export interface ListVehiclesInput {
  accountId: string;
}

export interface ListVehiclesOutput {
  vehicles: VehicleDTO[];
}

function toDTO(vehicle: Vehicle): VehicleDTO {
  return {
    id: vehicle.id,
    name: vehicle.name.value,
    plate: vehicle.plate ? vehicle.plate.value : null,
    initOdometer: vehicle.initOdometer.value,
    currentOdometer: vehicle.currentOdometer.value,
    createdAt: vehicle.createdAt.toISOString(),
  };
}

export class ListVehiclesUseCase {
  constructor(private readonly repository: VehicleRepository) {}

  async execute(input: ListVehiclesInput): Promise<ListVehiclesOutput> {
    const vehicles = await this.repository.findByAccount(input.accountId);
    return { vehicles: vehicles.map(toDTO) };
  }
}

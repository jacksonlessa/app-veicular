import { randomUUID } from "node:crypto";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";
import { Plate } from "@/domain/vehicle/value-objects/plate.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";

const MAX_VEHICLES_PER_ACCOUNT = 2;

export interface CreateVehicleInput {
  accountId: string;
  name: string;
  plate?: string;
  initOdometer: number;
}

export interface CreateVehicleOutput {
  vehicleId: string;
}

export class CreateVehicleUseCase {
  constructor(private readonly repository: VehicleRepository) {}

  async execute(input: CreateVehicleInput): Promise<CreateVehicleOutput> {
    const existing = await this.repository.findByAccount(input.accountId);
    if (existing.length >= MAX_VEHICLES_PER_ACCOUNT) {
      throw new BusinessRuleError("vehicle.limit_reached");
    }

    const name = VehicleName.create(input.name);
    const plate = input.plate ? Plate.create(input.plate) : null;
    const initOdometer = Odometer.create(input.initOdometer);

    const vehicle = Vehicle.create({
      id: randomUUID(),
      accountId: input.accountId,
      name,
      plate,
      brand: "",
      model: "",
      color: "",
      initOdometer,
      currentOdometer: initOdometer,
    });

    await this.repository.create(vehicle);

    return { vehicleId: vehicle.id };
  }
}

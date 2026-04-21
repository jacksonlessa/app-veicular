import type { FuelupRepository } from "@/domain/fuel/repositories/fuelup.repository";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import type { FuelupListItemDto } from "@/application/dtos/fuelup.dto";
import type { Fuelup } from "@/domain/fuel/entities/fuelup.entity";

export interface GetFuelupInput {
  accountId: string;
  fuelupId: string;
}

export type GetFuelupOutput = FuelupListItemDto;

function toDto(fuelup: Fuelup): FuelupListItemDto {
  return {
    id: fuelup.id,
    date: fuelup.date.value.toISOString(),
    odometer: fuelup.odometer.value,
    fuelType: fuelup.fuelType,
    fullTank: fuelup.fullTank,
    liters: fuelup.liters.value,
    pricePerLiter: fuelup.pricePerLiter.value,
    totalPrice: fuelup.totalPrice.value,
    kmPerLiter: fuelup.kmPerLiter ? fuelup.kmPerLiter.value : null,
  };
}

export class GetFuelupUseCase {
  constructor(
    private readonly fuelups: FuelupRepository,
    private readonly vehicles: VehicleRepository,
  ) {}

  async execute(input: GetFuelupInput): Promise<GetFuelupOutput> {
    const fuelup = await this.fuelups.findById(input.fuelupId);
    if (!fuelup) throw new BusinessRuleError("fuelup.not_found");

    const vehicle = await this.vehicles.findById(fuelup.vehicleId);
    if (!vehicle || vehicle.accountId !== input.accountId)
      throw new BusinessRuleError("vehicle.not_owned");

    return toDto(fuelup);
  }
}

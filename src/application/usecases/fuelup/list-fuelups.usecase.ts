import type { FuelupRepository } from "@/domain/fuel/repositories/fuelup.repository";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import type { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import type { FuelupListItemDto } from "@/application/dtos/fuelup.dto";

export interface ListFuelupsInput {
  accountId: string;
  vehicleId: string;
  page?: number;
  pageSize?: number;
}

export interface ListFuelupsOutput {
  items: FuelupListItemDto[];
  total: number;
}

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

export class ListFuelupsUseCase {
  constructor(
    private readonly fuelups: FuelupRepository,
    private readonly vehicles: VehicleRepository,
  ) {}

  async execute(input: ListFuelupsInput): Promise<ListFuelupsOutput> {
    const vehicle = await this.vehicles.findById(input.vehicleId);
    if (!vehicle) throw new BusinessRuleError("vehicle.not_found");
    if (vehicle.accountId !== input.accountId)
      throw new BusinessRuleError("vehicle.not_owned");

    const { items, total } = await this.fuelups.findByVehiclePaginated(
      input.vehicleId,
      input.page ?? 1,
      input.pageSize ?? 20,
    );

    return { items: items.map(toDto), total };
  }
}

import { Fuelup } from "../entities/fuelup.entity";

export interface FuelupRepository {
  findById(id: string): Promise<Fuelup | null>;
  findByVehicle(vehicleId: string): Promise<Fuelup[]>;
  findByVehiclePaginated(
    vehicleId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: Fuelup[]; total: number }>;
  findLastByVehicle(vehicleId: string): Promise<Fuelup | null>;
  findLastKmlByVehicle(vehicleId: string): Promise<number | null>;
  create(fuelup: Fuelup): Promise<Fuelup>;
  update(fuelup: Fuelup): Promise<Fuelup>;
  delete(id: string): Promise<void>;
}

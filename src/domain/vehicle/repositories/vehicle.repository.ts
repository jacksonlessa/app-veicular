import { Vehicle } from "../entities/vehicle.entity";

export interface VehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  findByAccount(accountId: string): Promise<Vehicle[]>;
  create(vehicle: Vehicle): Promise<Vehicle>;
  update(vehicle: Vehicle): Promise<Vehicle>;
  delete(id: string): Promise<void>;
}

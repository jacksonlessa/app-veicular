import { Maintenance } from "@/domain/maintenance/entities/maintenance.entity";

export interface MaintenanceRepository {
  findById(id: string): Promise<Maintenance | null>;
  findByVehicle(vehicleId: string): Promise<Maintenance[]>;
}

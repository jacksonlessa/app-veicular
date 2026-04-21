import { Maintenance } from "@/domain/maintenance/entities/maintenance.entity";

export interface MaintenanceRepository {
  findById(id: string): Promise<Maintenance | null>;
  findByVehicleId(vehicleId: string): Promise<Maintenance[]>;
}

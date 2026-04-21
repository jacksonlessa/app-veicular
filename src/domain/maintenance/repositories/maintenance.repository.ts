import { Maintenance } from "@/domain/maintenance/entities/maintenance.entity";

export interface MaintenanceRepository {
  findById(id: string): Promise<Maintenance | null>;
  findByVehicleId(vehicleId: string): Promise<Maintenance[]>;
  findByUser(userId: string): Promise<Maintenance[]>;
  create(maintenance: Maintenance): Promise<Maintenance>;
  update(maintenance: Maintenance): Promise<Maintenance>;
  delete(id: string): Promise<void>;
}

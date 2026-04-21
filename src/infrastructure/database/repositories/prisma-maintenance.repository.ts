import type { PrismaClient } from "@prisma/client";
import type { Maintenance } from "@/domain/maintenance/entities/maintenance.entity";
import type { MaintenanceRepository } from "@/domain/maintenance/repositories/maintenance.repository";
import { NotImplementedError } from "@/infrastructure/errors/not-implemented.error";

export class PrismaMaintenanceRepository implements MaintenanceRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async findById(_id: string): Promise<Maintenance | null> {
    throw new NotImplementedError(
      "PrismaMaintenanceRepository.findById",
      "Fase 5",
    );
  }

  async findByVehicle(_vehicleId: string): Promise<Maintenance[]> {
    throw new NotImplementedError(
      "PrismaMaintenanceRepository.findByVehicle",
      "Fase 5",
    );
  }

  async findByUser(_userId: string): Promise<Maintenance[]> {
    throw new NotImplementedError(
      "PrismaMaintenanceRepository.findByUser",
      "Fase 5",
    );
  }

  async create(_maintenance: Maintenance): Promise<Maintenance> {
    throw new NotImplementedError(
      "PrismaMaintenanceRepository.create",
      "Fase 5",
    );
  }

  async update(_maintenance: Maintenance): Promise<Maintenance> {
    throw new NotImplementedError(
      "PrismaMaintenanceRepository.update",
      "Fase 5",
    );
  }

  async delete(_id: string): Promise<void> {
    throw new NotImplementedError(
      "PrismaMaintenanceRepository.delete",
      "Fase 5",
    );
  }
}

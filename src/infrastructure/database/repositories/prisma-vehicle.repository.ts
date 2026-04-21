import type { PrismaClient } from "@prisma/client";
import type { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import { NotImplementedError } from "@/infrastructure/errors/not-implemented.error";

export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async findById(_id: string): Promise<Vehicle | null> {
    throw new NotImplementedError(
      "PrismaVehicleRepository.findById",
      "Fase 3",
    );
  }

  async findByAccount(_accountId: string): Promise<Vehicle[]> {
    throw new NotImplementedError(
      "PrismaVehicleRepository.findByAccount",
      "Fase 3",
    );
  }

  async create(_vehicle: Vehicle): Promise<Vehicle> {
    throw new NotImplementedError(
      "PrismaVehicleRepository.create",
      "Fase 3",
    );
  }

  async update(_vehicle: Vehicle): Promise<Vehicle> {
    throw new NotImplementedError(
      "PrismaVehicleRepository.update",
      "Fase 3",
    );
  }

  async delete(_id: string): Promise<void> {
    throw new NotImplementedError(
      "PrismaVehicleRepository.delete",
      "Fase 3",
    );
  }
}

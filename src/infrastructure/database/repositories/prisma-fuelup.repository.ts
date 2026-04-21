import type { PrismaClient } from "@prisma/client";
import type { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import type { FuelupRepository } from "@/domain/fuel/repositories/fuelup.repository";
import { NotImplementedError } from "@/infrastructure/errors/not-implemented.error";

export class PrismaFuelupRepository implements FuelupRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async findById(_id: string): Promise<Fuelup | null> {
    throw new NotImplementedError(
      "PrismaFuelupRepository.findById",
      "Fase 4",
    );
  }

  async findByVehicle(_vehicleId: string): Promise<Fuelup[]> {
    throw new NotImplementedError(
      "PrismaFuelupRepository.findByVehicle",
      "Fase 4",
    );
  }

  async findByVehiclePaginated(
    _vehicleId: string,
    _page: number,
    _pageSize: number,
  ): Promise<{ items: Fuelup[]; total: number }> {
    throw new NotImplementedError(
      "PrismaFuelupRepository.findByVehiclePaginated",
      "Fase 4",
    );
  }

  async findLastByVehicle(_vehicleId: string): Promise<Fuelup | null> {
    throw new NotImplementedError(
      "PrismaFuelupRepository.findLastByVehicle",
      "Fase 4",
    );
  }

  async create(_fuelup: Fuelup): Promise<Fuelup> {
    throw new NotImplementedError(
      "PrismaFuelupRepository.create",
      "Fase 4",
    );
  }

  async update(_fuelup: Fuelup): Promise<Fuelup> {
    throw new NotImplementedError(
      "PrismaFuelupRepository.update",
      "Fase 4",
    );
  }

  async delete(_id: string): Promise<void> {
    throw new NotImplementedError(
      "PrismaFuelupRepository.delete",
      "Fase 4",
    );
  }
}

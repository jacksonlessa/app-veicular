import type { PrismaClient, Vehicle as PrismaVehicle } from "@prisma/client";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";
import { Plate } from "@/domain/vehicle/value-objects/plate.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";

function toEntity(raw: PrismaVehicle): Vehicle {
  return Vehicle.rehydrate({
    id: raw.id,
    accountId: raw.accountId,
    name: VehicleName.create(raw.name),
    plate: raw.plate ? Plate.create(raw.plate) : null,
    brand: raw.brand ?? "",
    model: raw.model ?? "",
    color: raw.color ?? "",
    initOdometer: Odometer.create(raw.initOdometer),
    currentOdometer: Odometer.create(raw.currentOdometer),
    createdAt: raw.createdAt,
  });
}

function toPersistence(vehicle: Vehicle): {
  id: string;
  accountId: string;
  name: string;
  plate: string | null;
  brand: string;
  model: string;
  color: string;
  initOdometer: number;
  currentOdometer: number;
  createdAt: Date;
} {
  return {
    id: vehicle.id,
    accountId: vehicle.accountId,
    name: vehicle.name.value,
    plate: vehicle.plate ? vehicle.plate.value : null,
    brand: vehicle.brand,
    model: vehicle.model,
    color: vehicle.color,
    initOdometer: vehicle.initOdometer.value,
    currentOdometer: vehicle.currentOdometer.value,
    createdAt: vehicle.createdAt,
  };
}

export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async findById(id: string): Promise<Vehicle | null> {
    const row = await this._prisma.vehicle.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? toEntity(row) : null;
  }

  async findByAccount(accountId: string): Promise<Vehicle[]> {
    const rows = await this._prisma.vehicle.findMany({
      where: { accountId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toEntity);
  }

  async create(vehicle: Vehicle): Promise<Vehicle> {
    const data = toPersistence(vehicle);
    const row = await this._prisma.vehicle.create({ data });
    return toEntity(row);
  }

  async update(vehicle: Vehicle): Promise<Vehicle> {
    const data = toPersistence(vehicle);
    const row = await this._prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        name: data.name,
        plate: data.plate,
        brand: data.brand,
        model: data.model,
        color: data.color,
        currentOdometer: data.currentOdometer,
      },
    });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this._prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

import type {
  PrismaClient,
  Fuelup as PrismaFuelup,
  Prisma,
} from "@prisma/client";
import { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import type { FuelupRepository } from "@/domain/fuel/repositories/fuelup.repository";
import { FuelDate } from "@/domain/fuel/value-objects/fuel-date.vo";
import { FuelAmount } from "@/domain/fuel/value-objects/fuel-amount.vo";
import { FuelPrice } from "@/domain/fuel/value-objects/fuel-price.vo";
import { Kml } from "@/domain/fuel/value-objects/kml.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";

const CANONICAL_ORDER = [
  { date: "asc" as const },
  { odometer: "asc" as const },
  { createdAt: "asc" as const },
];

export function toEntity(raw: PrismaFuelup): Fuelup {
  return Fuelup.rehydrate({
    id: raw.id,
    vehicleId: raw.vehicleId,
    userId: raw.userId,
    date: FuelDate.create(raw.date),
    odometer: Odometer.create(raw.odometer),
    fuelType: raw.fuelType,
    fullTank: raw.fullTank,
    liters: FuelAmount.create(raw.liters),
    pricePerLiter: FuelPrice.create(raw.pricePerLiter),
    totalPrice: FuelPrice.create(raw.totalPrice),
    kmPerLiter: raw.kmPerLiter !== null ? Kml.create(raw.kmPerLiter) : null,
    createdAt: raw.createdAt,
  });
}

export function toPersistence(fuelup: Fuelup): Prisma.FuelupCreateInput {
  return {
    id: fuelup.id,
    vehicle: { connect: { id: fuelup.vehicleId } },
    user: { connect: { id: fuelup.userId } },
    date: fuelup.date.value,
    odometer: fuelup.odometer.value,
    fuelType: fuelup.fuelType,
    fullTank: fuelup.fullTank,
    liters: fuelup.liters.value,
    pricePerLiter: fuelup.pricePerLiter.value,
    totalPrice: fuelup.totalPrice.value,
    kmPerLiter: fuelup.kmPerLiter?.value ?? null,
    createdAt: fuelup.createdAt,
  };
}

export class PrismaFuelupRepository implements FuelupRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Fuelup | null> {
    const row = await this.prisma.fuelup.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByVehicle(vehicleId: string): Promise<Fuelup[]> {
    const rows = await this.prisma.fuelup.findMany({
      where: { vehicleId },
      orderBy: CANONICAL_ORDER,
    });
    return rows.map(toEntity);
  }

  async findByVehiclePaginated(
    vehicleId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: Fuelup[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.fuelup.findMany({
        where: { vehicleId },
        orderBy: CANONICAL_ORDER,
        skip,
        take: pageSize,
      }),
      this.prisma.fuelup.count({ where: { vehicleId } }),
    ]);
    return { items: rows.map(toEntity), total };
  }

  async findLastByVehicle(vehicleId: string): Promise<Fuelup | null> {
    const row = await this.prisma.fuelup.findFirst({
      where: { vehicleId },
      orderBy: { odometer: "desc" },
    });
    return row ? toEntity(row) : null;
  }

  async findLastKmlByVehicle(vehicleId: string): Promise<number | null> {
    const row = await this.prisma.fuelup.findFirst({
      where: { vehicleId, kmPerLiter: { not: null }, fullTank: true },
      orderBy: [{ date: "desc" }, { odometer: "desc" }],
      select: { kmPerLiter: true },
    });
    return row?.kmPerLiter ?? null;
  }

  async create(fuelup: Fuelup): Promise<Fuelup> {
    const data = toPersistence(fuelup);
    const row = await this.prisma.fuelup.create({ data });
    return toEntity(row);
  }

  async update(fuelup: Fuelup): Promise<Fuelup> {
    const row = await this.prisma.fuelup.update({
      where: { id: fuelup.id },
      data: {
        date: fuelup.date.value,
        odometer: fuelup.odometer.value,
        fuelType: fuelup.fuelType,
        fullTank: fuelup.fullTank,
        liters: fuelup.liters.value,
        pricePerLiter: fuelup.pricePerLiter.value,
        totalPrice: fuelup.totalPrice.value,
        kmPerLiter: fuelup.kmPerLiter?.value ?? null,
      },
    });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.fuelup.delete({ where: { id } });
  }
}

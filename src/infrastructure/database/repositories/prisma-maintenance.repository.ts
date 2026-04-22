import type { PrismaClient, Maintenance as PrismaMaintenance, MaintenanceItem as PrismaMaintenanceItem } from "@prisma/client";
import { Maintenance } from "@/domain/maintenance/entities/maintenance.entity";
import type { MaintenanceRepository } from "@/domain/maintenance/repositories/maintenance.repository";
import { MaintenanceItem } from "@/domain/maintenance/entities/maintenance-item.entity";
import { MaintenanceDate } from "@/domain/maintenance/value-objects/maintenance-date.vo";
import { ItemPrice } from "@/domain/maintenance/value-objects/item-price.vo";
import { ItemQuantity } from "@/domain/maintenance/value-objects/item-quantity.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { NotImplementedError } from "@/infrastructure/errors/not-implemented.error";

type PrismaMaintenanceWithItems = PrismaMaintenance & {
  items: PrismaMaintenanceItem[];
};

const include = { items: true } as const;

export class PrismaMaintenanceRepository implements MaintenanceRepository {
  constructor(private readonly _prisma: PrismaClient) {}

  async findById(id: string): Promise<Maintenance | null> {
    const raw = await this._prisma.maintenance.findUnique({
      where: { id },
      include,
    });

    if (!raw) return null;

    return this.toEntity(raw);
  }

  async findByVehicle(vehicleId: string): Promise<Maintenance[]> {
    const records = await this._prisma.maintenance.findMany({
      where: { vehicleId },
      orderBy: { date: "desc" },
      include,
    });

    return records.map((r) => this.toEntity(r));
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

  private toEntity(raw: PrismaMaintenanceWithItems): Maintenance {
    const items = raw.items.map((item) =>
      // subtotal is not passed because MaintenanceItem.rehydrate() recalculates it
      // via the getter: quantity.value * unitPrice.value
      MaintenanceItem.rehydrate({
        id: item.id,
        maintenanceId: item.maintenanceId,
        description: item.description,
        quantity: ItemQuantity.create(item.quantity),
        unitPrice: ItemPrice.create(item.unitPrice),
      }),
    );

    return Maintenance.rehydrate({
      id: raw.id,
      vehicleId: raw.vehicleId,
      userId: raw.userId,
      date: MaintenanceDate.create(raw.date),
      // odometer is optional in the domain entity; guard against null from DB
      odometer: raw.odometer !== null ? Odometer.create(raw.odometer) : undefined,
      // location in the DB stores the general description/location of the maintenance
      location: raw.location ?? "",
      items,
      createdAt: raw.createdAt,
    });
  }
}

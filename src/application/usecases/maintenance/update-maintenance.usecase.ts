import { randomUUID } from "node:crypto";
import type { MaintenanceRepository } from "@/domain/maintenance/repositories/maintenance.repository";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import type { FuelupRepository } from "@/domain/fuel/repositories/fuelup.repository";
import type { TransactionRunner } from "@/application/ports/transaction-runner";
import { Maintenance } from "@/domain/maintenance/entities/maintenance.entity";
import { MaintenanceItem } from "@/domain/maintenance/entities/maintenance-item.entity";
import { MaintenanceDate } from "@/domain/maintenance/value-objects/maintenance-date.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { computeNewOdometer } from "./_shared/compute-new-odometer";
import { toMaintenanceDTO, type MaintenanceDTO } from "@/application/dtos/maintenance.dto";

export interface UpdateMaintenanceInput {
  accountId: string;
  maintenanceId: string;
  date: Date;
  odometer?: number;
  description?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export class UpdateMaintenanceUseCase {
  constructor(
    private readonly maintenances: MaintenanceRepository,
    private readonly vehicles: VehicleRepository,
    private readonly fuelups: FuelupRepository,
    private readonly txRunner: TransactionRunner,
  ) {}

  async execute(input: UpdateMaintenanceInput): Promise<MaintenanceDTO> {
    const existing = await this.maintenances.findById(input.maintenanceId);
    if (!existing) throw new BusinessRuleError("maintenance.not_found");

    const vehicle = await this.vehicles.findById(existing.vehicleId);
    if (!vehicle) throw new BusinessRuleError("vehicle.not_found");
    if (vehicle.accountId !== input.accountId)
      throw new BusinessRuleError("vehicle.not_owned");

    const allFuelups = await this.fuelups.findByVehicle(existing.vehicleId);
    const allMaintenances = await this.maintenances.findByVehicle(existing.vehicleId);
    // Exclude the maintenance being updated from the odometer candidates
    const otherMaintenances = allMaintenances.filter((m) => m.id !== existing.id);

    const maintenanceItems = input.items.map((item) =>
      MaintenanceItem.create({
        id: randomUUID(),
        maintenanceId: existing.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }),
    );

    const entity = Maintenance.create({
      id: existing.id,
      vehicleId: existing.vehicleId,
      userId: existing.userId,
      date: MaintenanceDate.create(input.date),
      odometer: input.odometer !== undefined ? Odometer.create(input.odometer) : undefined,
      location: input.description,
      items: maintenanceItems,
      createdAt: existing.createdAt,
    });

    const newCurrentOdometer = computeNewOdometer({
      fuelupOdometers: allFuelups.map((f) => f.odometer.value),
      maintenanceOdometers: otherMaintenances.map((m) => m.odometer?.value ?? null),
      newOdometer: input.odometer,
      initOdometer: vehicle.initOdometer.value,
    });

    await this.txRunner.saveMaintenance({
      mode: "update",
      maintenance: {
        id: entity.id,
        vehicleId: entity.vehicleId,
        userId: entity.userId,
        date: entity.date.value,
        odometer: entity.odometer?.value ?? null,
        location: entity.location ?? null,
        totalPrice: entity.totalPrice,
      },
      items: entity.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity.value,
        unitPrice: item.unitPrice.value,
        subtotal: item.subtotal,
      })),
      vehicleId: existing.vehicleId,
      newCurrentOdometer,
    });

    return toMaintenanceDTO(entity);
  }
}

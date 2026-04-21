import { randomUUID } from "node:crypto";
import type { FuelupRepository } from "@/domain/fuel/repositories/fuelup.repository";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import type { TransactionRunner } from "@/application/ports/transaction-runner";
import { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import { FuelupService } from "@/domain/fuel/services/fuelup.service";
import { FuelAmount } from "@/domain/fuel/value-objects/fuel-amount.vo";
import { FuelDate } from "@/domain/fuel/value-objects/fuel-date.vo";
import { FuelPrice } from "@/domain/fuel/value-objects/fuel-price.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { recalculateChain } from "./_shared/recalculate-chain";
import { byCanonicalOrder } from "./_shared/order";

export interface RegisterFuelupInput {
  accountId: string;
  userId: string;
  vehicleId: string;
  date: Date;
  odometer: number;
  fuelType: string;
  fullTank: boolean;
  liters?: number;
  pricePerLiter?: number;
  totalPrice?: number;
}

export interface RegisterFuelupOutput {
  fuelupId: string;
}

export class RegisterFuelupUseCase {
  constructor(
    private readonly fuelups: FuelupRepository,
    private readonly vehicles: VehicleRepository,
    private readonly txRunner: TransactionRunner,
  ) {}

  async execute(input: RegisterFuelupInput): Promise<RegisterFuelupOutput> {
    const vehicle = await this.vehicles.findById(input.vehicleId);
    if (!vehicle) throw new BusinessRuleError("vehicle.not_found");
    if (vehicle.accountId !== input.accountId)
      throw new BusinessRuleError("vehicle.not_owned");

    const last = await this.fuelups.findLastByVehicle(input.vehicleId);
    if (last && input.odometer <= last.odometer.value)
      throw new BusinessRuleError("odometer.not_increasing");

    // Validate and compute the 3-field rule
    const computed = FuelupService.compute({
      liters: input.liters !== undefined ? FuelAmount.create(input.liters) : undefined,
      pricePerLiter: input.pricePerLiter !== undefined ? FuelPrice.create(input.pricePerLiter) : undefined,
      totalPrice: input.totalPrice !== undefined ? FuelPrice.create(input.totalPrice) : undefined,
      currentOdometer: Odometer.create(input.odometer),
      currentFullTank: input.fullTank,
      previous: last
        ? { odometer: last.odometer, fullTank: last.fullTank }
        : null,
    });

    // Build new entity (kmPerLiter will be overridden by recalculateChain)
    const newFuelup = Fuelup.create({
      id: randomUUID(),
      vehicleId: input.vehicleId,
      userId: input.userId,
      date: FuelDate.create(input.date),
      odometer: Odometer.create(input.odometer),
      fuelType: input.fuelType,
      fullTank: input.fullTank,
      liters: computed.liters,
      pricePerLiter: computed.pricePerLiter,
      totalPrice: computed.totalPrice,
      kmPerLiter: computed.kml,
      createdAt: new Date(),
    });

    // Load full chain, insert new fuelup, sort canonically, recalculate
    const existing = await this.fuelups.findByVehicle(input.vehicleId);
    const chain = [...existing, newFuelup].sort(byCanonicalOrder);

    // Validate monotonicity of the full chain after insertion
    for (let i = 1; i < chain.length; i++) {
      if (chain[i].odometer.value <= chain[i - 1].odometer.value) {
        throw new BusinessRuleError("odometer.not_increasing");
      }
    }

    const recomputed = recalculateChain(chain);

    const upserted = recomputed.find((f) => f.id === newFuelup.id)!;
    const others = recomputed.filter((f) => f.id !== newFuelup.id);
    const newOdometer = Math.max(...recomputed.map((f) => f.odometer.value));

    await this.txRunner.saveFuelup({
      mode: "create",
      fuelup: {
        id: upserted.id,
        vehicleId: upserted.vehicleId,
        userId: upserted.userId,
        date: upserted.date.value,
        odometer: upserted.odometer.value,
        fuelType: upserted.fuelType,
        fullTank: upserted.fullTank,
        liters: upserted.liters.value,
        pricePerLiter: upserted.pricePerLiter.value,
        totalPrice: upserted.totalPrice.value,
        kmPerLiter: upserted.kmPerLiter?.value ?? null,
      },
      recomputed: others.map((f) => ({
        id: f.id,
        kmPerLiter: f.kmPerLiter?.value ?? null,
      })),
      vehicleId: vehicle.id,
      newCurrentOdometer: newOdometer,
    });

    return { fuelupId: newFuelup.id };
  }
}

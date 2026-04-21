import type { FuelupRepository } from "@/domain/fuel/repositories/fuelup.repository";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import type { TransactionRunner } from "@/application/ports/transaction-runner";
import { FuelupService } from "@/domain/fuel/services/fuelup.service";
import { FuelAmount } from "@/domain/fuel/value-objects/fuel-amount.vo";
import { FuelDate } from "@/domain/fuel/value-objects/fuel-date.vo";
import { FuelPrice } from "@/domain/fuel/value-objects/fuel-price.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { recalculateChain } from "./_shared/recalculate-chain";
import { byCanonicalOrder } from "./_shared/order";
import { computeNewOdometer } from "./_shared/compute-new-odometer";

export interface UpdateFuelupInput {
  accountId: string;
  fuelupId: string;
  date?: Date;
  odometer?: number;
  fuelType?: string;
  fullTank?: boolean;
  liters?: number;
  pricePerLiter?: number;
  totalPrice?: number;
}

export interface UpdateFuelupOutput {
  fuelupId: string;
}

export class UpdateFuelupUseCase {
  constructor(
    private readonly fuelups: FuelupRepository,
    private readonly vehicles: VehicleRepository,
    private readonly txRunner: TransactionRunner,
  ) {}

  async execute(input: UpdateFuelupInput): Promise<UpdateFuelupOutput> {
    const existing = await this.fuelups.findById(input.fuelupId);
    if (!existing) throw new BusinessRuleError("fuelup.not_found");

    const vehicle = await this.vehicles.findById(existing.vehicleId);
    if (!vehicle) throw new BusinessRuleError("vehicle.not_found");
    if (vehicle.accountId !== input.accountId)
      throw new BusinessRuleError("vehicle.not_owned");

    // Resolve updated field values
    const newDate = input.date !== undefined ? FuelDate.create(input.date) : existing.date;
    const newOdometer =
      input.odometer !== undefined ? Odometer.create(input.odometer) : existing.odometer;
    const newFuelType = input.fuelType !== undefined ? input.fuelType : existing.fuelType;
    const newFullTank = input.fullTank !== undefined ? input.fullTank : existing.fullTank;

    // Determine if any monetary field was provided
    const hasNewLiters = input.liters !== undefined;
    const hasNewPpl = input.pricePerLiter !== undefined;
    const hasNewTotal = input.totalPrice !== undefined;
    const monetaryChanged = hasNewLiters || hasNewPpl || hasNewTotal;

    let newLiters = existing.liters;
    let newPpl = existing.pricePerLiter;
    let newTotal = existing.totalPrice;

    if (monetaryChanged) {
      // Re-validate with FuelupService.compute (enforces 3-field rule).
      // We need exactly 2 of the 3 fields. Use incoming values; fall back to
      // existing only when the caller did NOT provide that specific field.
      // Important: we must not forward all 3 at once — the service throws if filled != 2.
      const litersArg = hasNewLiters ? FuelAmount.create(input.liters!) : undefined;
      const pplArg = hasNewPpl ? FuelPrice.create(input.pricePerLiter!) : undefined;
      const totalArg = hasNewTotal ? FuelPrice.create(input.totalPrice!) : undefined;

      // Count how many new values were explicitly provided
      const newCount = [hasNewLiters, hasNewPpl, hasNewTotal].filter(Boolean).length;

      // If caller only changed 1 field, fill in a second from the existing values
      // but only if that lets us keep exactly 2.
      let litersToPass = litersArg;
      let pplToPass = pplArg;
      const totalToPass = totalArg;

      if (newCount === 1) {
        if (hasNewLiters) {
          // caller gave liters; pick ppl from existing
          pplToPass = existing.pricePerLiter;
        } else if (hasNewPpl) {
          // caller gave ppl; pick liters from existing
          litersToPass = existing.liters;
        } else {
          // caller gave total; pick ppl from existing
          pplToPass = existing.pricePerLiter;
        }
      }

      const computed = FuelupService.compute({
        liters: litersToPass,
        pricePerLiter: pplToPass,
        totalPrice: totalToPass,
        currentOdometer: newOdometer,
        currentFullTank: newFullTank,
        previous: null,
      });
      newLiters = computed.liters;
      newPpl = computed.pricePerLiter;
      newTotal = computed.totalPrice;
    }

    // Build the updated fuelup entity
    const updated = Fuelup.rehydrate({
      id: existing.id,
      vehicleId: existing.vehicleId,
      userId: existing.userId,
      date: newDate,
      odometer: newOdometer,
      fuelType: newFuelType,
      fullTank: newFullTank,
      liters: newLiters,
      pricePerLiter: newPpl,
      totalPrice: newTotal,
      kmPerLiter: existing.kmPerLiter,
      createdAt: existing.createdAt,
    });

    // Load full chain, replace updated fuelup, sort canonically
    const all = await this.fuelups.findByVehicle(existing.vehicleId);
    const withoutOld = all.filter((f) => f.id !== existing.id);
    const chain = [...withoutOld, updated].sort(byCanonicalOrder);

    // Validate monotonicity: every consecutive pair must be strictly increasing in odometer
    for (let i = 1; i < chain.length; i++) {
      if (chain[i].odometer.value <= chain[i - 1].odometer.value) {
        throw new BusinessRuleError("odometer.not_increasing");
      }
    }

    const recomputed = recalculateChain(chain);

    const upserted = recomputed.find((f) => f.id === updated.id)!;
    const others = recomputed.filter((f) => f.id !== updated.id);
    const newCurrentOdometer = computeNewOdometer(recomputed, vehicle);

    await this.txRunner.saveFuelup({
      mode: "update",
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
      newCurrentOdometer,
    });

    return { fuelupId: updated.id };
  }
}

import { describe, expect, it } from "vitest";
import { recalculateChain } from "@/application/usecases/fuelup/_shared/recalculate-chain";
import { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import { FuelAmount } from "@/domain/fuel/value-objects/fuel-amount.vo";
import { FuelDate } from "@/domain/fuel/value-objects/fuel-date.vo";
import { FuelPrice } from "@/domain/fuel/value-objects/fuel-price.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";

let seqId = 0;

function makeFuelup(
  overrides: {
    id?: string;
    odometer: number;
    liters: number;
    fullTank: boolean;
    date?: Date;
    kmPerLiter?: number | null;
  },
): Fuelup {
  const id = overrides.id ?? `fuelup-${++seqId}`;
  const pricePerLiter = 5;
  const liters = overrides.liters;
  const totalPrice = Math.round(liters * pricePerLiter * 100) / 100;

  return Fuelup.rehydrate({
    id,
    vehicleId: "vehicle-1",
    userId: "user-1",
    date: FuelDate.create(overrides.date ?? new Date("2024-01-01T10:00:00Z")),
    odometer: Odometer.create(overrides.odometer),
    fuelType: "Gasolina",
    fullTank: overrides.fullTank,
    liters: FuelAmount.create(liters),
    pricePerLiter: FuelPrice.create(pricePerLiter),
    totalPrice: FuelPrice.create(totalPrice),
    kmPerLiter: null,
    createdAt: new Date("2024-01-01T10:00:00Z"),
  });
}

describe("recalculateChain", () => {
  it("(a) sequência somente com tanques cheios calcula km/l corretamente", () => {
    // Full tank at 10000, full at 10500 (500km, 50L = 10 km/l), full at 11000 (500km, 50L = 10 km/l)
    const f1 = makeFuelup({ odometer: 10000, liters: 50, fullTank: true });
    const f2 = makeFuelup({ odometer: 10500, liters: 50, fullTank: true });
    const f3 = makeFuelup({ odometer: 11000, liters: 50, fullTank: true });

    const result = recalculateChain([f1, f2, f3]);

    expect(result[0].kmPerLiter).toBeNull(); // first full, no reference
    expect(result[1].kmPerLiter?.value).toBeCloseTo(10, 5);
    expect(result[2].kmPerLiter?.value).toBeCloseTo(10, 5);
  });

  it("(b) parciais entre dois cheios somam litros no denominador", () => {
    // Full at 10000 (50L), partial at 10200 (20L), full at 10600 (30L)
    // km/l for last full = (10600 - 10000) / (20 + 30) = 600 / 50 = 12
    const f1 = makeFuelup({ odometer: 10000, liters: 50, fullTank: true });
    const f2 = makeFuelup({ odometer: 10200, liters: 20, fullTank: false });
    const f3 = makeFuelup({ odometer: 10600, liters: 30, fullTank: true });

    const result = recalculateChain([f1, f2, f3]);

    expect(result[0].kmPerLiter).toBeNull();
    expect(result[1].kmPerLiter).toBeNull();
    expect(result[2].kmPerLiter?.value).toBeCloseTo(12, 5);
  });

  it("(c) primeiro tanque cheio da história sem anterior retorna kmPerLiter null", () => {
    const f1 = makeFuelup({ odometer: 10000, liters: 50, fullTank: true });

    const result = recalculateChain([f1]);

    expect(result[0].kmPerLiter).toBeNull();
  });

  it("(d) edição retroativa recalcula km/l dos posteriores (odômetro do primeiro alterado)", () => {
    // Simulates: first full was edited from odometer 10000 → 9500
    // f2 at 10500: km/l = (10500 - 9500) / 50 = 20 (was 10 before edit)
    const f1 = makeFuelup({ odometer: 9500, liters: 50, fullTank: true });
    const f2 = makeFuelup({ odometer: 10500, liters: 50, fullTank: true });

    const result = recalculateChain([f1, f2]);

    expect(result[0].kmPerLiter).toBeNull();
    expect(result[1].kmPerLiter?.value).toBeCloseTo(20, 5);
  });

  it("(e) exclusão do primeiro cheio zera o km/l do segundo", () => {
    // After deleting first full tank, second full has no reference → null
    const f2 = makeFuelup({ odometer: 10500, liters: 50, fullTank: true });
    const f3 = makeFuelup({ odometer: 11000, liters: 50, fullTank: true });

    const result = recalculateChain([f2, f3]);

    expect(result[0].kmPerLiter).toBeNull();
    expect(result[1].kmPerLiter?.value).toBeCloseTo(10, 5);
  });

  it("(f) entrada vazia retorna lista vazia", () => {
    expect(recalculateChain([])).toEqual([]);
  });

  it("não muta a entrada original", () => {
    const f1 = makeFuelup({ odometer: 10000, liters: 50, fullTank: true });
    const f2 = makeFuelup({ odometer: 10500, liters: 50, fullTank: true });
    const input = [f1, f2];

    recalculateChain(input);

    // original objects unchanged
    expect(input[0]).toBe(f1);
    expect(input[1]).toBe(f2);
    expect(input[0].kmPerLiter).toBeNull();
    expect(input[1].kmPerLiter).toBeNull();
  });

  it("saída preserva todos os outros campos inalterados", () => {
    const f1 = makeFuelup({ id: "original-id", odometer: 10000, liters: 50, fullTank: true });
    const f2 = makeFuelup({ id: "second-id", odometer: 10500, liters: 40, fullTank: true });

    const result = recalculateChain([f1, f2]);

    expect(result[1].id).toBe("second-id");
    expect(result[1].vehicleId).toBe("vehicle-1");
    expect(result[1].odometer.value).toBe(10500);
    expect(result[1].liters.value).toBe(40);
    expect(result[1].fullTank).toBe(true);
  });
});

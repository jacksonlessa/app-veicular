import { describe, it, expect, beforeEach } from "vitest";
import { UpdateFuelupUseCase } from "@/application/usecases/fuelup/update-fuelup.usecase";
import { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import { FuelAmount } from "@/domain/fuel/value-objects/fuel-amount.vo";
import { FuelDate } from "@/domain/fuel/value-objects/fuel-date.vo";
import { FuelPrice } from "@/domain/fuel/value-objects/fuel-price.vo";
import { Kml } from "@/domain/fuel/value-objects/kml.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";
import {
  FakeFuelupRepository,
  FakeVehicleRepository,
  FakeTransactionRunner,
} from "./_fakes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVehicle(id: string, accountId: string, initOdometer = 0): Vehicle {
  return Vehicle.create({
    id,
    accountId,
    name: VehicleName.create("Carro Teste"),
    plate: null,
    brand: "",
    model: "",
    color: "",
    initOdometer: Odometer.create(initOdometer),
    currentOdometer: Odometer.create(initOdometer),
  });
}

function makeFuelup(
  id: string,
  vehicleId: string,
  odometer: number,
  liters: number,
  fullTank: boolean,
  date: Date,
  kmPerLiter: number | null = null,
): Fuelup {
  const ppl = 5;
  const total = Math.round(liters * ppl * 100) / 100;
  return Fuelup.rehydrate({
    id,
    vehicleId,
    userId: "user-1",
    date: FuelDate.create(date),
    odometer: Odometer.create(odometer),
    fuelType: "Gasolina",
    fullTank,
    liters: FuelAmount.create(liters),
    pricePerLiter: FuelPrice.create(ppl),
    totalPrice: FuelPrice.create(total),
    kmPerLiter: kmPerLiter !== null ? Kml.create(kmPerLiter) : null,
    createdAt: date,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UpdateFuelupUseCase", () => {
  let fuelupRepo: FakeFuelupRepository;
  let vehicleRepo: FakeVehicleRepository;
  let txRunner: FakeTransactionRunner;
  let useCase: UpdateFuelupUseCase;

  beforeEach(() => {
    fuelupRepo = new FakeFuelupRepository();
    vehicleRepo = new FakeVehicleRepository();
    txRunner = new FakeTransactionRunner();
    useCase = new UpdateFuelupUseCase(fuelupRepo, vehicleRepo, txRunner);
  });

  describe("sucesso: edição simples sem mudança monetária", () => {
    it("calls saveFuelup with mode=update and returns fuelupId", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);
      fuelupRepo.seed([
        makeFuelup("f1", "v1", 1000, 40, true, new Date("2024-01-01T08:00:00Z")),
        makeFuelup("f2", "v1", 1400, 40, true, new Date("2024-02-01T08:00:00Z"), 10),
      ]);

      const result = await useCase.execute({
        accountId: "acc-1",
        fuelupId: "f2",
        fuelType: "Etanol",
      });

      expect(result.fuelupId).toBe("f2");
      expect(txRunner.lastSaveFuelupCall).not.toBeNull();
      expect(txRunner.lastSaveFuelupCall!.mode).toBe("update");
      expect(txRunner.lastSaveFuelupCall!.fuelup.fuelType).toBe("Etanol");
    });
  });

  describe("sucesso: edição retroativa invalida km/l dos posteriores", () => {
    it("recomputed includes all fuelups after the edited one with updated km/l", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);
      // f1 at 1000, f2 at 1400 (km/l = 10), f3 at 1800 (km/l = 10)
      fuelupRepo.seed([
        makeFuelup("f1", "v1", 1000, 40, true, new Date("2024-01-01T08:00:00Z")),
        makeFuelup("f2", "v1", 1400, 40, true, new Date("2024-02-01T08:00:00Z"), 10),
        makeFuelup("f3", "v1", 1800, 40, true, new Date("2024-03-01T08:00:00Z"), 10),
      ]);

      // Edit f1: change liters (monetary change) — forces recompute of downstream km/l
      await useCase.execute({
        accountId: "acc-1",
        fuelupId: "f1",
        liters: 50,
        pricePerLiter: 5,
      });

      const call = txRunner.lastSaveFuelupCall!;
      // f2 and f3 should be in recomputed (not the edited f1 itself)
      expect(call.recomputed.length).toBe(2);
      const ids = call.recomputed.map((r) => r.id);
      expect(ids).toContain("f2");
      expect(ids).toContain("f3");
    });
  });

  describe("sucesso: mudança de fullTank true→false recalcula", () => {
    it("fuelup with fullTank changed to false gets kmPerLiter null", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);
      fuelupRepo.seed([
        makeFuelup("f1", "v1", 1000, 40, true, new Date("2024-01-01T08:00:00Z")),
        makeFuelup("f2", "v1", 1400, 40, true, new Date("2024-02-01T08:00:00Z"), 10),
      ]);

      // Change f2 to not full tank
      await useCase.execute({
        accountId: "acc-1",
        fuelupId: "f2",
        fullTank: false,
      });

      const call = txRunner.lastSaveFuelupCall!;
      // f2 (now partial) should have kmPerLiter = null
      expect(call.fuelup.kmPerLiter).toBeNull();
    });
  });

  describe("erro: fuelup.not_found", () => {
    it("throws when fuelup does not exist", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);

      await expect(
        useCase.execute({ accountId: "acc-1", fuelupId: "nonexistent" }),
      ).rejects.toMatchObject({ code: "fuelup.not_found" });
    });
  });

  describe("erro: vehicle.not_owned", () => {
    it("throws when the fuelup vehicle belongs to a different account", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-other")]);
      fuelupRepo.seed([
        makeFuelup("f1", "v1", 1000, 40, true, new Date("2024-01-01T08:00:00Z")),
      ]);

      await expect(
        useCase.execute({ accountId: "acc-1", fuelupId: "f1" }),
      ).rejects.toMatchObject({ code: "vehicle.not_owned" });
    });
  });

  describe("erro: odometer.not_increasing (mudança de odômetro quebra monotonicidade)", () => {
    it("throws when new odometer conflicts with a posterior fuelup", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);
      fuelupRepo.seed([
        makeFuelup("f1", "v1", 1000, 40, true, new Date("2024-01-01T08:00:00Z")),
        makeFuelup("f2", "v1", 1400, 40, true, new Date("2024-02-01T08:00:00Z"), 10),
      ]);

      // Try to move f1 to odometer >= f2 odometer
      await expect(
        useCase.execute({ accountId: "acc-1", fuelupId: "f1", odometer: 1400 }),
      ).rejects.toMatchObject({ code: "odometer.not_increasing" });
    });

    it("throws when new odometer is not greater than the previous fuelup", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);
      fuelupRepo.seed([
        makeFuelup("f1", "v1", 1000, 40, true, new Date("2024-01-01T08:00:00Z")),
        makeFuelup("f2", "v1", 1400, 40, true, new Date("2024-02-01T08:00:00Z"), 10),
      ]);

      // Try to move f2 to odometer <= f1 odometer
      await expect(
        useCase.execute({ accountId: "acc-1", fuelupId: "f2", odometer: 1000 }),
      ).rejects.toMatchObject({ code: "odometer.not_increasing" });
    });
  });

  describe("erro: fuelup.three_fields (mudança monetária com todos os 3 campos)", () => {
    it("throws when all three monetary fields are provided", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);
      fuelupRepo.seed([
        makeFuelup("f1", "v1", 1000, 40, true, new Date("2024-01-01T08:00:00Z")),
      ]);

      // Providing all three — FuelupService.compute requires exactly 2
      await expect(
        useCase.execute({
          accountId: "acc-1",
          fuelupId: "f1",
          liters: 50,
          pricePerLiter: 5,
          totalPrice: 250,
        }),
      ).rejects.toMatchObject({ code: "fuelup.three_fields" });
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { RegisterFuelupUseCase } from "@/application/usecases/fuelup/register-fuelup.usecase";
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

function makeVehicle(id: string, accountId: string): Vehicle {
  return Vehicle.create({
    id,
    accountId,
    name: VehicleName.create("Carro Teste"),
    plate: null,
    brand: "",
    model: "",
    color: "",
    initOdometer: Odometer.create(0),
    currentOdometer: Odometer.create(0),
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

describe("RegisterFuelupUseCase", () => {
  let fuelupRepo: FakeFuelupRepository;
  let vehicleRepo: FakeVehicleRepository;
  let txRunner: FakeTransactionRunner;
  let useCase: RegisterFuelupUseCase;

  beforeEach(() => {
    fuelupRepo = new FakeFuelupRepository();
    vehicleRepo = new FakeVehicleRepository();
    txRunner = new FakeTransactionRunner();
    useCase = new RegisterFuelupUseCase(fuelupRepo, vehicleRepo, txRunner);
  });

  // Scenario 1: success — first fuelup
  describe("sucesso: primeiro abastecimento", () => {
    it("returns fuelupId and calls saveFuelup with mode=create", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);

      const result = await useCase.execute({
        accountId: "acc-1",
        userId: "user-1",
        vehicleId: "v1",
        date: new Date("2024-01-01T10:00:00Z"),
        odometer: 1000,
        fuelType: "Gasolina",
        fullTank: true,
        liters: 40,
        pricePerLiter: 5,
      });

      expect(result.fuelupId).toBeTruthy();
      expect(txRunner.lastSaveFuelupCall).not.toBeNull();
      expect(txRunner.lastSaveFuelupCall!.mode).toBe("create");
    });

    it("kmPerLiter is null for the first full-tank fuelup (no previous)", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);

      await useCase.execute({
        accountId: "acc-1",
        userId: "user-1",
        vehicleId: "v1",
        date: new Date("2024-01-01T10:00:00Z"),
        odometer: 1000,
        fuelType: "Gasolina",
        fullTank: true,
        liters: 40,
        pricePerLiter: 5,
      });

      expect(txRunner.lastSaveFuelupCall!.fuelup.kmPerLiter).toBeNull();
      expect(txRunner.lastSaveFuelupCall!.newCurrentOdometer).toBe(1000);
    });
  });

  // Scenario 2: success — with previous full-tank, km/l computed
  describe("sucesso: com abastecimento anterior cheio — calcula km/l via recalculateChain", () => {
    it("km/l = (current_odometer - prev_odometer) / liters", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);
      fuelupRepo.seed([
        makeFuelup("f1", "v1", 1000, 40, true, new Date("2024-01-01T08:00:00Z")),
      ]);

      // 1400 - 1000 = 400 km / 40 L = 10 km/l
      const result = await useCase.execute({
        accountId: "acc-1",
        userId: "user-1",
        vehicleId: "v1",
        date: new Date("2024-02-01T08:00:00Z"),
        odometer: 1400,
        fuelType: "Gasolina",
        fullTank: true,
        liters: 40,
        pricePerLiter: 5,
      });

      const kml = txRunner.lastSaveFuelupCall!.fuelup.kmPerLiter;
      expect(kml).not.toBeNull();
      expect(kml).toBeCloseTo(10, 5);

      // Existing fuelup f1 (no previous before it) should have kmPerLiter null in recomputed
      const recomputed = txRunner.lastSaveFuelupCall!.recomputed;
      const f1Entry = recomputed.find((r) => r.id === "f1");
      expect(f1Entry).toBeDefined();
      expect(f1Entry!.kmPerLiter).toBeNull();

      // newCurrentOdometer = max(1000, 1400) = 1400
      expect(txRunner.lastSaveFuelupCall!.newCurrentOdometer).toBe(1400);

      // fuelupId returned matches the new fuelup in saveFuelup call
      expect(txRunner.lastSaveFuelupCall!.fuelup.id).toBe(result.fuelupId);
    });
  });

  // Scenario 3: error — vehicle.not_owned
  describe("erro: vehicle.not_owned", () => {
    it("throws when vehicle belongs to a different account", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-other")]);

      await expect(
        useCase.execute({
          accountId: "acc-1",
          userId: "user-1",
          vehicleId: "v1",
          date: new Date("2024-01-01T10:00:00Z"),
          odometer: 1000,
          fuelType: "Gasolina",
          fullTank: true,
          liters: 40,
          pricePerLiter: 5,
        }),
      ).rejects.toMatchObject({ code: "vehicle.not_owned" });
    });
  });

  // Scenario 4: error — vehicle.not_found
  describe("erro: vehicle.not_found", () => {
    it("throws when vehicle does not exist", async () => {
      await expect(
        useCase.execute({
          accountId: "acc-1",
          userId: "user-1",
          vehicleId: "nonexistent",
          date: new Date("2024-01-01T10:00:00Z"),
          odometer: 1000,
          fuelType: "Gasolina",
          fullTank: true,
          liters: 40,
          pricePerLiter: 5,
        }),
      ).rejects.toMatchObject({ code: "vehicle.not_found" });
    });
  });

  // Scenario 5: error — odometer.not_increasing
  describe("erro: odometer.not_increasing", () => {
    it("throws when new odometer equals last odometer", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);
      fuelupRepo.seed([
        makeFuelup("f1", "v1", 1000, 40, true, new Date("2024-01-01T08:00:00Z")),
      ]);

      await expect(
        useCase.execute({
          accountId: "acc-1",
          userId: "user-1",
          vehicleId: "v1",
          date: new Date("2024-02-01T08:00:00Z"),
          odometer: 1000,
          fuelType: "Gasolina",
          fullTank: true,
          liters: 40,
          pricePerLiter: 5,
        }),
      ).rejects.toMatchObject({ code: "odometer.not_increasing" });
    });

    it("throws when new odometer is less than last odometer", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);
      fuelupRepo.seed([
        makeFuelup("f1", "v1", 1000, 40, true, new Date("2024-01-01T08:00:00Z")),
      ]);

      await expect(
        useCase.execute({
          accountId: "acc-1",
          userId: "user-1",
          vehicleId: "v1",
          date: new Date("2024-02-01T08:00:00Z"),
          odometer: 999,
          fuelType: "Gasolina",
          fullTank: true,
          liters: 40,
          pricePerLiter: 5,
        }),
      ).rejects.toMatchObject({ code: "odometer.not_increasing" });
    });
  });

  // Scenario 6: error — fuelup.three_fields (only 1 price field provided)
  describe("erro: fuelup.three_fields", () => {
    it("throws when only liters is provided (pricePerLiter and totalPrice missing)", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);

      await expect(
        useCase.execute({
          accountId: "acc-1",
          userId: "user-1",
          vehicleId: "v1",
          date: new Date("2024-01-01T10:00:00Z"),
          odometer: 1000,
          fuelType: "Gasolina",
          fullTank: true,
          liters: 40,
        }),
      ).rejects.toMatchObject({ code: "fuelup.three_fields" });
    });

    it("throws when all three price fields are provided", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);

      await expect(
        useCase.execute({
          accountId: "acc-1",
          userId: "user-1",
          vehicleId: "v1",
          date: new Date("2024-01-01T10:00:00Z"),
          odometer: 1000,
          fuelType: "Gasolina",
          fullTank: true,
          liters: 40,
          pricePerLiter: 5,
          totalPrice: 200,
        }),
      ).rejects.toMatchObject({ code: "fuelup.three_fields" });
    });
  });

  // Scenario 7: sucesso — dois campos fornecidos → terceiro derivado corretamente (pricePerLiter + totalPrice)
  // Nota: fuelup.total_mismatch não pode ser disparado pelo fluxo normal do use case porque
  // FuelupService.compute sempre deriva o terceiro campo de forma coerente antes de chamar Fuelup.create.
  // A cobertura de total_mismatch está nos testes da entidade: tests/unit/domain/fuel/fuelup.entity.test.ts
  describe("sucesso: dois campos fornecidos → terceiro campo derivado corretamente", () => {
    it("derives liters from pricePerLiter + totalPrice and creates fuelup successfully", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);

      // pricePerLiter=5, totalPrice=200 → liters derived = 200/5 = 40
      const result = await useCase.execute({
        accountId: "acc-1",
        userId: "user-1",
        vehicleId: "v1",
        date: new Date("2024-01-01T10:00:00Z"),
        odometer: 1000,
        fuelType: "Gasolina",
        fullTank: true,
        pricePerLiter: 5,
        totalPrice: 200,
      });

      expect(result.fuelupId).toBeTruthy();
      // liters derived = 200/5 = 40
      expect(txRunner.lastSaveFuelupCall!.fuelup.liters).toBeCloseTo(40, 3);
    });
  });
});

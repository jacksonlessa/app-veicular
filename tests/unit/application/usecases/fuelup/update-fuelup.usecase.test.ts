import { describe, it, expect, beforeEach } from "vitest";
import { UpdateFuelupUseCase } from "@/application/usecases/fuelup/update-fuelup.usecase";
import type { FuelupRepository } from "@/domain/fuel/repositories/fuelup.repository";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import type {
  TransactionRunner,
  SaveFuelupData,
  DeleteFuelupData,
  CreateAccountWithOwnerData,
  AcceptInviteTransactionData,
} from "@/application/ports/transaction-runner";
import { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import { FuelAmount } from "@/domain/fuel/value-objects/fuel-amount.vo";
import { FuelDate } from "@/domain/fuel/value-objects/fuel-date.vo";
import { FuelPrice } from "@/domain/fuel/value-objects/fuel-price.vo";
import { Kml } from "@/domain/fuel/value-objects/kml.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

class FakeFuelupRepository implements FuelupRepository {
  private store: Fuelup[] = [];

  seed(fuelups: Fuelup[]) {
    this.store = [...fuelups];
  }

  async findById(id: string): Promise<Fuelup | null> {
    return this.store.find((f) => f.id === id) ?? null;
  }

  async findByVehicle(vehicleId: string): Promise<Fuelup[]> {
    return this.store
      .filter((f) => f.vehicleId === vehicleId)
      .sort((a, b) => {
        const d = a.date.value.getTime() - b.date.value.getTime();
        if (d !== 0) return d;
        const o = a.odometer.value - b.odometer.value;
        if (o !== 0) return o;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }

  async findByVehiclePaginated(vehicleId: string, page: number, pageSize: number) {
    const all = await this.findByVehicle(vehicleId);
    const start = (page - 1) * pageSize;
    return { items: all.slice(start, start + pageSize), total: all.length };
  }

  async findLastByVehicle(vehicleId: string): Promise<Fuelup | null> {
    const sorted = await this.findByVehicle(vehicleId);
    return sorted[sorted.length - 1] ?? null;
  }

  async create(fuelup: Fuelup): Promise<Fuelup> {
    this.store.push(fuelup);
    return fuelup;
  }

  async update(fuelup: Fuelup): Promise<Fuelup> {
    this.store = this.store.map((f) => (f.id === fuelup.id ? fuelup : f));
    return fuelup;
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((f) => f.id !== id);
  }
}

class FakeVehicleRepository implements VehicleRepository {
  private store: Vehicle[] = [];

  seed(vehicles: Vehicle[]) {
    this.store = [...vehicles];
  }

  async findById(id: string): Promise<Vehicle | null> {
    return this.store.find((v) => v.id === id) ?? null;
  }

  async findByAccount(accountId: string): Promise<Vehicle[]> {
    return this.store.filter((v) => v.accountId === accountId);
  }

  async create(vehicle: Vehicle): Promise<Vehicle> {
    this.store.push(vehicle);
    return vehicle;
  }

  async update(vehicle: Vehicle): Promise<Vehicle> {
    this.store = this.store.map((v) => (v.id === vehicle.id ? vehicle : v));
    return vehicle;
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((v) => v.id !== id);
  }
}

class FakeTransactionRunner implements TransactionRunner {
  public lastSaveFuelupCall: SaveFuelupData | null = null;
  public lastDeleteFuelupCall: DeleteFuelupData | null = null;

  async createAccountWithOwner(_data: CreateAccountWithOwnerData): Promise<void> {}
  async acceptInvite(_data: AcceptInviteTransactionData): Promise<void> {}

  async saveFuelup(data: SaveFuelupData): Promise<void> {
    this.lastSaveFuelupCall = data;
  }

  async deleteFuelup(data: DeleteFuelupData): Promise<void> {
    this.lastDeleteFuelupCall = data;
  }
}

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

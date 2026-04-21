import { describe, it, expect, beforeEach } from "vitest";
import { DeleteFuelupUseCase } from "@/application/usecases/fuelup/delete-fuelup.usecase";
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

describe("DeleteFuelupUseCase", () => {
  let fuelupRepo: FakeFuelupRepository;
  let vehicleRepo: FakeVehicleRepository;
  let txRunner: FakeTransactionRunner;
  let useCase: DeleteFuelupUseCase;

  beforeEach(() => {
    fuelupRepo = new FakeFuelupRepository();
    vehicleRepo = new FakeVehicleRepository();
    txRunner = new FakeTransactionRunner();
    useCase = new DeleteFuelupUseCase(fuelupRepo, vehicleRepo, txRunner);
  });

  describe("sucesso: exclusão em cadeia com 3 fuelups", () => {
    it("calls deleteFuelup with correct fuelupId and recomputed list", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);
      fuelupRepo.seed([
        makeFuelup("f1", "v1", 1000, 40, true, new Date("2024-01-01T08:00:00Z")),
        makeFuelup("f2", "v1", 1400, 40, true, new Date("2024-02-01T08:00:00Z"), 10),
        makeFuelup("f3", "v1", 1800, 40, true, new Date("2024-03-01T08:00:00Z"), 10),
      ]);

      await useCase.execute({ accountId: "acc-1", fuelupId: "f2" });

      const call = txRunner.lastDeleteFuelupCall!;
      expect(call.fuelupId).toBe("f2");
      // recomputed should have f1 and f3 (the remaining fuelups)
      expect(call.recomputed.length).toBe(2);
      expect(call.newCurrentOdometer).toBe(1800);
    });
  });

  describe("sucesso: exclusão do primeiro tanque cheio zera km/l do segundo", () => {
    it("second fuelup kmPerLiter becomes null after first full-tank is deleted", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);
      fuelupRepo.seed([
        makeFuelup("f1", "v1", 1000, 40, true, new Date("2024-01-01T08:00:00Z")),
        makeFuelup("f2", "v1", 1400, 40, true, new Date("2024-02-01T08:00:00Z"), 10),
      ]);

      await useCase.execute({ accountId: "acc-1", fuelupId: "f1" });

      const call = txRunner.lastDeleteFuelupCall!;
      const f2Entry = call.recomputed.find((r) => r.id === "f2");
      expect(f2Entry).toBeDefined();
      expect(f2Entry!.kmPerLiter).toBeNull();
    });
  });

  describe("sucesso: exclusão do único fuelup reseta currentOdometer para initOdometer", () => {
    it("newCurrentOdometer equals vehicle.initOdometer when chain becomes empty", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1", 500)]);
      fuelupRepo.seed([
        makeFuelup("f1", "v1", 1000, 40, true, new Date("2024-01-01T08:00:00Z")),
      ]);

      await useCase.execute({ accountId: "acc-1", fuelupId: "f1" });

      const call = txRunner.lastDeleteFuelupCall!;
      expect(call.recomputed.length).toBe(0);
      expect(call.newCurrentOdometer).toBe(500);
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
});

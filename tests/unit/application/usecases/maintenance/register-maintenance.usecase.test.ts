import { describe, it, expect, beforeEach } from "vitest";
import { RegisterMaintenanceUseCase } from "@/application/usecases/maintenance/register-maintenance.usecase";
import { Maintenance } from "@/domain/maintenance/entities/maintenance.entity";
import { MaintenanceItem } from "@/domain/maintenance/entities/maintenance-item.entity";
import { MaintenanceDate } from "@/domain/maintenance/value-objects/maintenance-date.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";
import {
  FakeMaintenanceRepository,
  FakeVehicleRepository,
  FakeFuelupRepository,
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

function makeMaintenance(
  id: string,
  vehicleId: string,
  date: Date,
  odometer?: number,
): Maintenance {
  const item = MaintenanceItem.create({
    id: "item-1",
    maintenanceId: id,
    description: "Troca de óleo",
    quantity: 1,
    unitPrice: 100,
  });
  return Maintenance.create({
    id,
    vehicleId,
    userId: "user-1",
    date: MaintenanceDate.create(date),
    odometer: odometer !== undefined ? Odometer.create(odometer) : undefined,
    items: [item],
    createdAt: date,
  });
}

const PAST = new Date("2024-01-01T08:00:00Z");
const BASE_ITEMS = [{ description: "Troca de óleo", quantity: 1, unitPrice: 150 }];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RegisterMaintenanceUseCase", () => {
  let maintenanceRepo: FakeMaintenanceRepository;
  let vehicleRepo: FakeVehicleRepository;
  let fuelupRepo: FakeFuelupRepository;
  let txRunner: FakeTransactionRunner;
  let useCase: RegisterMaintenanceUseCase;

  beforeEach(() => {
    maintenanceRepo = new FakeMaintenanceRepository();
    vehicleRepo = new FakeVehicleRepository();
    fuelupRepo = new FakeFuelupRepository();
    txRunner = new FakeTransactionRunner();
    useCase = new RegisterMaintenanceUseCase(maintenanceRepo, vehicleRepo, fuelupRepo, txRunner);
  });

  describe("sucesso: cria manutenção com odômetro", () => {
    it("calls saveMaintenance with mode=create and returns DTO", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1", 0)]);

      const result = await useCase.execute({
        accountId: "acc-1",
        userId: "user-1",
        vehicleId: "v1",
        date: PAST,
        odometer: 5000,
        items: BASE_ITEMS,
      });

      expect(result.vehicleId).toBe("v1");
      expect(result.totalPrice).toBe(150);
      expect(result.items).toHaveLength(1);
      expect(result.odometer).toBe(5000);

      const call = txRunner.lastSaveMaintenanceCall!;
      expect(call).not.toBeNull();
      expect(call.mode).toBe("create");
      expect(call.maintenance.odometer).toBe(5000);
      expect(call.newCurrentOdometer).toBe(5000);
    });
  });

  describe("sucesso: cria manutenção sem odômetro", () => {
    it("newCurrentOdometer is undefined when no odometers exist", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1", 0)]);

      await useCase.execute({
        accountId: "acc-1",
        userId: "user-1",
        vehicleId: "v1",
        date: PAST,
        items: BASE_ITEMS,
      });

      const call = txRunner.lastSaveMaintenanceCall!;
      expect(call.maintenance.odometer).toBeNull();
      expect(call.newCurrentOdometer).toBeUndefined();
    });

    it("newCurrentOdometer uses max from existing maintenances when new has no odometer", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1", 0)]);
      maintenanceRepo.seed([makeMaintenance("m-existing", "v1", PAST, 3000)]);

      await useCase.execute({
        accountId: "acc-1",
        userId: "user-1",
        vehicleId: "v1",
        date: new Date("2024-06-01T08:00:00Z"),
        items: BASE_ITEMS,
      });

      const call = txRunner.lastSaveMaintenanceCall!;
      expect(call.newCurrentOdometer).toBe(3000);
    });
  });

  describe("sucesso: totalPrice calculado a partir dos itens", () => {
    it("totalPrice equals sum of subtotals", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);

      const result = await useCase.execute({
        accountId: "acc-1",
        userId: "user-1",
        vehicleId: "v1",
        date: PAST,
        items: [
          { description: "Filtro de ar", quantity: 2, unitPrice: 50 },
          { description: "Mão de obra", quantity: 1, unitPrice: 80 },
        ],
      });

      // 2*50 + 1*80 = 180
      expect(result.totalPrice).toBe(180);
      expect(result.items).toHaveLength(2);
    });
  });

  describe("erro: vehicle.not_found", () => {
    it("throws when vehicle does not exist", async () => {
      await expect(
        useCase.execute({
          accountId: "acc-1",
          userId: "user-1",
          vehicleId: "nonexistent",
          date: PAST,
          items: BASE_ITEMS,
        }),
      ).rejects.toMatchObject({ code: "vehicle.not_found" });
    });
  });

  describe("erro: vehicle.not_owned", () => {
    it("throws when vehicle belongs to a different account", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-other")]);

      await expect(
        useCase.execute({
          accountId: "acc-1",
          userId: "user-1",
          vehicleId: "v1",
          date: PAST,
          items: BASE_ITEMS,
        }),
      ).rejects.toMatchObject({ code: "vehicle.not_owned" });
    });
  });

  describe("erro: maintenance.no_items", () => {
    it("throws when items list is empty", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);

      await expect(
        useCase.execute({
          accountId: "acc-1",
          userId: "user-1",
          vehicleId: "v1",
          date: PAST,
          items: [],
        }),
      ).rejects.toMatchObject({ code: "maintenance.no_items" });
    });
  });
});

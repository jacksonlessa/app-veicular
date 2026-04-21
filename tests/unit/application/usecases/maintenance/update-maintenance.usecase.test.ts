import { describe, it, expect, beforeEach } from "vitest";
import { UpdateMaintenanceUseCase } from "@/application/usecases/maintenance/update-maintenance.usecase";
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
    id: `item-${id}`,
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
const FUTURE_PAST = new Date("2024-06-01T08:00:00Z");
const BASE_ITEMS = [{ description: "Filtro de óleo", quantity: 1, unitPrice: 200 }];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UpdateMaintenanceUseCase", () => {
  let maintenanceRepo: FakeMaintenanceRepository;
  let vehicleRepo: FakeVehicleRepository;
  let fuelupRepo: FakeFuelupRepository;
  let txRunner: FakeTransactionRunner;
  let useCase: UpdateMaintenanceUseCase;

  beforeEach(() => {
    maintenanceRepo = new FakeMaintenanceRepository();
    vehicleRepo = new FakeVehicleRepository();
    fuelupRepo = new FakeFuelupRepository();
    txRunner = new FakeTransactionRunner();
    useCase = new UpdateMaintenanceUseCase(maintenanceRepo, vehicleRepo, fuelupRepo, txRunner);
  });

  describe("sucesso: atualiza manutenção com odômetro", () => {
    it("calls saveMaintenance with mode=update and returns DTO", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1", 0)]);
      maintenanceRepo.seed([makeMaintenance("m1", "v1", PAST, 3000)]);

      const result = await useCase.execute({
        accountId: "acc-1",
        maintenanceId: "m1",
        date: FUTURE_PAST,
        odometer: 8000,
        items: BASE_ITEMS,
      });

      expect(result.id).toBe("m1");
      expect(result.odometer).toBe(8000);
      expect(result.totalPrice).toBe(200);

      const call = txRunner.lastSaveMaintenanceCall!;
      expect(call.mode).toBe("update");
      expect(call.maintenance.odometer).toBe(8000);
      expect(call.newCurrentOdometer).toBe(8000);
    });
  });

  describe("sucesso: exclui manutenção atual do cálculo de odômetro", () => {
    it("newCurrentOdometer uses other maintenances only, excluding the one being updated", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1", 0)]);
      maintenanceRepo.seed([
        makeMaintenance("m1", "v1", PAST, 5000),
        makeMaintenance("m2", "v1", new Date("2024-03-01T08:00:00Z"), 3000),
      ]);

      // Updating m1 (odometer 5000) to have no odometer;
      // m2 has odometer 3000 — newCurrentOdometer should be 3000
      await useCase.execute({
        accountId: "acc-1",
        maintenanceId: "m1",
        date: FUTURE_PAST,
        items: BASE_ITEMS,
      });

      const call = txRunner.lastSaveMaintenanceCall!;
      expect(call.maintenance.odometer).toBeNull();
      expect(call.newCurrentOdometer).toBe(3000);
    });
  });

  describe("sucesso: sem odômetro e sem outras manutenções com odômetro", () => {
    it("newCurrentOdometer is undefined", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1", 0)]);
      maintenanceRepo.seed([makeMaintenance("m1", "v1", PAST)]);

      await useCase.execute({
        accountId: "acc-1",
        maintenanceId: "m1",
        date: FUTURE_PAST,
        items: BASE_ITEMS,
      });

      const call = txRunner.lastSaveMaintenanceCall!;
      expect(call.newCurrentOdometer).toBeUndefined();
    });
  });

  describe("sucesso: recalcula totalPrice com novos itens", () => {
    it("totalPrice equals sum of new item subtotals", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);
      maintenanceRepo.seed([makeMaintenance("m1", "v1", PAST)]);

      const result = await useCase.execute({
        accountId: "acc-1",
        maintenanceId: "m1",
        date: FUTURE_PAST,
        items: [
          { description: "Pastilhas de freio", quantity: 4, unitPrice: 50 },
          { description: "Mão de obra", quantity: 1, unitPrice: 120 },
        ],
      });

      // 4*50 + 1*120 = 320
      expect(result.totalPrice).toBe(320);
      expect(result.items).toHaveLength(2);
    });
  });

  describe("erro: maintenance.not_found", () => {
    it("throws when maintenance does not exist", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);

      await expect(
        useCase.execute({
          accountId: "acc-1",
          maintenanceId: "nonexistent",
          date: FUTURE_PAST,
          items: BASE_ITEMS,
        }),
      ).rejects.toMatchObject({ code: "maintenance.not_found" });
    });
  });

  describe("erro: vehicle.not_owned", () => {
    it("throws when maintenance vehicle belongs to a different account", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-other")]);
      maintenanceRepo.seed([makeMaintenance("m1", "v1", PAST)]);

      await expect(
        useCase.execute({
          accountId: "acc-1",
          maintenanceId: "m1",
          date: FUTURE_PAST,
          items: BASE_ITEMS,
        }),
      ).rejects.toMatchObject({ code: "vehicle.not_owned" });
    });
  });

  describe("erro: maintenance.no_items", () => {
    it("throws when items list is empty", async () => {
      vehicleRepo.seed([makeVehicle("v1", "acc-1")]);
      maintenanceRepo.seed([makeMaintenance("m1", "v1", PAST)]);

      await expect(
        useCase.execute({
          accountId: "acc-1",
          maintenanceId: "m1",
          date: FUTURE_PAST,
          items: [],
        }),
      ).rejects.toMatchObject({ code: "maintenance.no_items" });
    });
  });
});

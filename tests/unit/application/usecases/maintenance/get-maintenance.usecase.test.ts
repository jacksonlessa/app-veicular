import { describe, it, expect, beforeEach, vi, type Mocked } from "vitest";
import { GetMaintenanceUseCase } from "@/application/usecases/maintenance/get-maintenance.usecase";
import type { MaintenanceRepository } from "@/domain/maintenance/repositories/maintenance.repository";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import { Maintenance } from "@/domain/maintenance/entities/maintenance.entity";
import { MaintenanceItem } from "@/domain/maintenance/entities/maintenance-item.entity";
import { MaintenanceDate } from "@/domain/maintenance/value-objects/maintenance-date.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(): MaintenanceItem {
  return MaintenanceItem.create({ id: "item-1", description: "Troca de óleo", quantity: 1, unitPrice: 150 });
}

function makeMaintenance(vehicleId = "vehicle-1"): Maintenance {
  return Maintenance.create({
    id: "maint-1",
    vehicleId,
    userId: "user-1",
    date: MaintenanceDate.create(new Date("2024-01-10")),
    odometer: Odometer.create(50000),
    location: "Oficina",
    items: [makeItem()],
    createdAt: new Date("2024-01-10T00:00:00.000Z"),
  });
}

function makeVehicle(id = "vehicle-1", accountId = "account-1"): Vehicle {
  return Vehicle.create({
    id,
    accountId,
    name: VehicleName.create("Meu Carro"),
    plate: null,
    brand: "Toyota",
    model: "Corolla",
    color: "Branco",
    initOdometer: Odometer.create(0),
    currentOdometer: Odometer.create(50000),
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const mockMaintenanceRepo = {
  findById: vi.fn(),
  findByVehicle: vi.fn(),
  findByUser: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} satisfies Mocked<MaintenanceRepository>;

const mockVehicleRepo = {
  findById: vi.fn(),
  findByAccount: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} satisfies Mocked<VehicleRepository>;

function makeUseCase() {
  return new GetMaintenanceUseCase(
    mockMaintenanceRepo as unknown as MaintenanceRepository,
    mockVehicleRepo as unknown as VehicleRepository,
  );
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("GetMaintenanceUseCase", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("sucesso", () => {
    it("should return MaintenanceDTO when maintenance exists and account is correct", async () => {
      const maintenance = makeMaintenance("vehicle-1");
      const vehicle = makeVehicle("vehicle-1", "account-1");
      mockMaintenanceRepo.findById.mockResolvedValue(maintenance);
      mockVehicleRepo.findById.mockResolvedValue(vehicle);

      const useCase = makeUseCase();
      const result = await useCase.execute({ id: "maint-1", accountId: "account-1" });

      expect(result.id).toBe("maint-1");
      expect(result.vehicleId).toBe("vehicle-1");
      expect(result.totalPrice).toBe(150);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].description).toBe("Troca de óleo");
    });

    it("should return description mapped from location", async () => {
      const maintenance = makeMaintenance("vehicle-1");
      const vehicle = makeVehicle("vehicle-1", "account-1");
      mockMaintenanceRepo.findById.mockResolvedValue(maintenance);
      mockVehicleRepo.findById.mockResolvedValue(vehicle);

      const useCase = makeUseCase();
      const result = await useCase.execute({ id: "maint-1", accountId: "account-1" });

      expect(result.description).toBe("Oficina");
    });
  });

  describe("erro: not_found", () => {
    it("should throw BusinessRuleError with code maintenance.not_found when maintenance does not exist", async () => {
      mockMaintenanceRepo.findById.mockResolvedValue(null);

      const useCase = makeUseCase();
      await expect(
        useCase.execute({ id: "nonexistent", accountId: "account-1" }),
      ).rejects.toMatchObject({ code: "maintenance.not_found" });
    });
  });

  describe("erro: ownership errado", () => {
    it("should throw BusinessRuleError with code vehicle.not_owned when vehicle belongs to another account", async () => {
      const maintenance = makeMaintenance("vehicle-1");
      const vehicle = makeVehicle("vehicle-1", "real-owner");
      mockMaintenanceRepo.findById.mockResolvedValue(maintenance);
      mockVehicleRepo.findById.mockResolvedValue(vehicle);

      const useCase = makeUseCase();
      await expect(
        useCase.execute({ id: "maint-1", accountId: "other-account" }),
      ).rejects.toMatchObject({ code: "vehicle.not_owned" });
    });

    it("should throw BusinessRuleError with code vehicle.not_owned when vehicle does not exist", async () => {
      const maintenance = makeMaintenance("vehicle-1");
      mockMaintenanceRepo.findById.mockResolvedValue(maintenance);
      mockVehicleRepo.findById.mockResolvedValue(null);

      const useCase = makeUseCase();
      await expect(
        useCase.execute({ id: "maint-1", accountId: "account-1" }),
      ).rejects.toMatchObject({ code: "vehicle.not_owned" });
    });
  });
});

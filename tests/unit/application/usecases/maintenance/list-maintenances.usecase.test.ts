import { describe, it, expect, beforeEach, vi, type Mocked } from "vitest";
import { ListMaintenancesUseCase } from "@/application/usecases/maintenance/list-maintenances.usecase";
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
  return MaintenanceItem.create({ id: "item-1", description: "Revisão", quantity: 1, unitPrice: 200 });
}

function makeMaintenance(id: string, vehicleId = "vehicle-1"): Maintenance {
  return Maintenance.create({
    id,
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
} satisfies Mocked<MaintenanceRepository>;

const mockVehicleRepo = {
  findById: vi.fn(),
  findByAccount: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} satisfies Mocked<VehicleRepository>;

function makeUseCase() {
  return new ListMaintenancesUseCase(
    mockMaintenanceRepo as unknown as MaintenanceRepository,
    mockVehicleRepo as unknown as VehicleRepository,
  );
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("ListMaintenancesUseCase", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("sucesso", () => {
    it("should return array of MaintenanceDTO when vehicle belongs to account", async () => {
      const vehicle = makeVehicle("vehicle-1", "account-1");
      const maintenances = [makeMaintenance("maint-1"), makeMaintenance("maint-2")];
      mockVehicleRepo.findById.mockResolvedValue(vehicle);
      mockMaintenanceRepo.findByVehicle.mockResolvedValue(maintenances);

      const useCase = makeUseCase();
      const result = await useCase.execute({ vehicleId: "vehicle-1", accountId: "account-1" });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("maint-1");
      expect(result[1].id).toBe("maint-2");
    });

    it("should return empty array when vehicle has no maintenances", async () => {
      const vehicle = makeVehicle("vehicle-1", "account-1");
      mockVehicleRepo.findById.mockResolvedValue(vehicle);
      mockMaintenanceRepo.findByVehicle.mockResolvedValue([]);

      const useCase = makeUseCase();
      const result = await useCase.execute({ vehicleId: "vehicle-1", accountId: "account-1" });

      expect(result).toEqual([]);
    });

    it("should call findByVehicle with the correct vehicleId", async () => {
      const vehicle = makeVehicle("vehicle-1", "account-1");
      mockVehicleRepo.findById.mockResolvedValue(vehicle);
      mockMaintenanceRepo.findByVehicle.mockResolvedValue([]);

      const useCase = makeUseCase();
      await useCase.execute({ vehicleId: "vehicle-1", accountId: "account-1" });

      expect(mockMaintenanceRepo.findByVehicle).toHaveBeenCalledWith("vehicle-1");
    });
  });

  describe("erro: vehicle não encontrado", () => {
    it("should throw BusinessRuleError with code vehicle.not_found when vehicle does not exist", async () => {
      mockVehicleRepo.findById.mockResolvedValue(null);

      const useCase = makeUseCase();
      await expect(
        useCase.execute({ vehicleId: "nonexistent", accountId: "account-1" }),
      ).rejects.toMatchObject({ code: "vehicle.not_found" });
    });
  });

  describe("erro: ownership errado — vehicle de outro account", () => {
    it("should throw BusinessRuleError with code vehicle.not_owned when vehicle belongs to another account", async () => {
      const vehicle = makeVehicle("vehicle-1", "real-owner");
      mockVehicleRepo.findById.mockResolvedValue(vehicle);

      const useCase = makeUseCase();
      await expect(
        useCase.execute({ vehicleId: "vehicle-1", accountId: "other-account" }),
      ).rejects.toMatchObject({ code: "vehicle.not_owned" });
    });

    it("should not call findByVehicle when ownership check fails", async () => {
      const vehicle = makeVehicle("vehicle-1", "real-owner");
      mockVehicleRepo.findById.mockResolvedValue(vehicle);

      const useCase = makeUseCase();
      await useCase.execute({ vehicleId: "vehicle-1", accountId: "other" }).catch(() => {});

      expect(mockMaintenanceRepo.findByVehicle).not.toHaveBeenCalled();
    });
  });
});

import { describe, it, expect, beforeEach, vi, type Mocked } from "vitest";
import { DeleteMaintenanceUseCase } from "@/application/usecases/maintenance/delete-maintenance.usecase";
import type { MaintenanceRepository } from "@/domain/maintenance/repositories/maintenance.repository";
import type { FuelupRepository } from "@/domain/fuel/repositories/fuelup.repository";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import type { TransactionRunner } from "@/application/ports/transaction-runner";
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

function makeMaintenance(id: string, vehicleId = "vehicle-1", withOdometer = true): Maintenance {
  return Maintenance.create({
    id,
    vehicleId,
    userId: "user-1",
    date: MaintenanceDate.create(new Date("2024-01-10")),
    odometer: withOdometer ? Odometer.create(50000) : undefined,
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

const mockFuelupRepo = {
  findById: vi.fn(),
  findByVehicle: vi.fn(),
  findByVehiclePaginated: vi.fn(),
  findLastByVehicle: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} satisfies Mocked<FuelupRepository>;

const mockVehicleRepo = {
  findById: vi.fn(),
  findByAccount: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} satisfies Mocked<VehicleRepository>;

const mockTxRunner = {
  createAccountWithOwner: vi.fn(),
  acceptInvite: vi.fn(),
  saveMaintenance: vi.fn(),
  deleteMaintenance: vi.fn(),
} satisfies Mocked<TransactionRunner>;

function makeUseCase() {
  return new DeleteMaintenanceUseCase(
    mockMaintenanceRepo as unknown as MaintenanceRepository,
    mockFuelupRepo as unknown as FuelupRepository,
    mockVehicleRepo as unknown as VehicleRepository,
    mockTxRunner as unknown as TransactionRunner,
  );
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("DeleteMaintenanceUseCase", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("sucesso — manutenção com odômetro", () => {
    it("should call deleteMaintenance with recalculateOdometer=true and computed newCurrentOdometer", async () => {
      const maintenance = makeMaintenance("maint-1", "vehicle-1", true);
      const vehicle = makeVehicle("vehicle-1", "account-1");
      mockMaintenanceRepo.findById.mockResolvedValue(maintenance);
      mockVehicleRepo.findById.mockResolvedValue(vehicle);
      mockFuelupRepo.findByVehicle.mockResolvedValue([]);
      mockMaintenanceRepo.findByVehicle.mockResolvedValue([maintenance]); // includes the one being deleted
      mockTxRunner.deleteMaintenance.mockResolvedValue(undefined);

      const useCase = makeUseCase();
      await useCase.execute({ id: "maint-1", accountId: "account-1" });

      expect(mockTxRunner.deleteMaintenance).toHaveBeenCalledWith(
        expect.objectContaining({
          maintenanceId: "maint-1",
          vehicleId: "vehicle-1",
          recalculateOdometer: true,
          newCurrentOdometer: expect.any(Number),
        }),
      );
    });

    it("should compute newCurrentOdometer as initOdometer when no other records with odometer exist", async () => {
      const maintenance = makeMaintenance("maint-1", "vehicle-1", true);
      const vehicle = makeVehicle("vehicle-1", "account-1");
      mockMaintenanceRepo.findById.mockResolvedValue(maintenance);
      mockVehicleRepo.findById.mockResolvedValue(vehicle);
      mockFuelupRepo.findByVehicle.mockResolvedValue([]);
      // only the maintenance being deleted — remaining after filter = []
      mockMaintenanceRepo.findByVehicle.mockResolvedValue([maintenance]);
      mockTxRunner.deleteMaintenance.mockResolvedValue(undefined);

      const useCase = makeUseCase();
      await useCase.execute({ id: "maint-1", accountId: "account-1" });

      expect(mockTxRunner.deleteMaintenance).toHaveBeenCalledWith(
        expect.objectContaining({
          newCurrentOdometer: 0, // vehicle.initOdometer
        }),
      );
    });
  });

  describe("sucesso — manutenção sem odômetro", () => {
    it("should call deleteMaintenance with recalculateOdometer=false when maintenance has no odometer", async () => {
      const maintenance = makeMaintenance("maint-1", "vehicle-1", false); // no odometer
      const vehicle = makeVehicle("vehicle-1", "account-1");
      mockMaintenanceRepo.findById.mockResolvedValue(maintenance);
      mockVehicleRepo.findById.mockResolvedValue(vehicle);
      mockTxRunner.deleteMaintenance.mockResolvedValue(undefined);

      const useCase = makeUseCase();
      await useCase.execute({ id: "maint-1", accountId: "account-1" });

      expect(mockTxRunner.deleteMaintenance).toHaveBeenCalledWith(
        expect.objectContaining({
          maintenanceId: "maint-1",
          vehicleId: "vehicle-1",
          recalculateOdometer: false,
        }),
      );
      // fuelup and maintenance repos should NOT be called when no odometer recalculation needed
      expect(mockFuelupRepo.findByVehicle).not.toHaveBeenCalled();
      expect(mockMaintenanceRepo.findByVehicle).not.toHaveBeenCalled();
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

    it("should not call txRunner.deleteMaintenance when maintenance is not found", async () => {
      mockMaintenanceRepo.findById.mockResolvedValue(null);

      const useCase = makeUseCase();
      await useCase.execute({ id: "none", accountId: "acc" }).catch(() => {});

      expect(mockTxRunner.deleteMaintenance).not.toHaveBeenCalled();
    });
  });

  describe("erro: vehicle não encontrado", () => {
    it("should throw BusinessRuleError with code vehicle.not_found when vehicle does not exist", async () => {
      const maintenance = makeMaintenance("maint-1");
      mockMaintenanceRepo.findById.mockResolvedValue(maintenance);
      mockVehicleRepo.findById.mockResolvedValue(null);

      const useCase = makeUseCase();
      await expect(
        useCase.execute({ id: "maint-1", accountId: "account-1" }),
      ).rejects.toMatchObject({ code: "vehicle.not_found" });
    });
  });

  describe("erro: ownership errado", () => {
    it("should throw BusinessRuleError with code vehicle.not_owned when vehicle belongs to another account", async () => {
      const maintenance = makeMaintenance("maint-1");
      const vehicle = makeVehicle("vehicle-1", "real-owner");
      mockMaintenanceRepo.findById.mockResolvedValue(maintenance);
      mockVehicleRepo.findById.mockResolvedValue(vehicle);

      const useCase = makeUseCase();
      await expect(
        useCase.execute({ id: "maint-1", accountId: "other-account" }),
      ).rejects.toMatchObject({ code: "vehicle.not_owned" });
    });

    it("should not call txRunner.deleteMaintenance when ownership check fails", async () => {
      const maintenance = makeMaintenance("maint-1");
      const vehicle = makeVehicle("vehicle-1", "real-owner");
      mockMaintenanceRepo.findById.mockResolvedValue(maintenance);
      mockVehicleRepo.findById.mockResolvedValue(vehicle);

      const useCase = makeUseCase();
      await useCase.execute({ id: "maint-1", accountId: "other" }).catch(() => {});

      expect(mockTxRunner.deleteMaintenance).not.toHaveBeenCalled();
    });
  });
});

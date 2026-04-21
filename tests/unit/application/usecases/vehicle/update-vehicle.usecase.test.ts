import { describe, it, expect, beforeEach, vi } from "vitest";
import { UpdateVehicleUseCase } from "@/application/usecases/vehicle/update-vehicle.usecase";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVehicle(overrides?: {
  id?: string;
  accountId?: string;
  initOdometer?: number;
  currentOdometer?: number;
}): Vehicle {
  const init = overrides?.initOdometer ?? 0;
  const current = overrides?.currentOdometer ?? init;
  return Vehicle.create({
    id: overrides?.id ?? "vehicle-1",
    accountId: overrides?.accountId ?? "account-1",
    name: VehicleName.create("Carro Original"),
    plate: null,
    brand: "",
    model: "",
    color: "",
    initOdometer: Odometer.create(init),
    currentOdometer: Odometer.create(current),
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const mockRepo = {
  findById: vi.fn(),
  findByAccount: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} satisfies jest.Mocked<VehicleRepository>;

function makeUseCase() {
  return new UpdateVehicleUseCase(mockRepo as unknown as VehicleRepository);
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("UpdateVehicleUseCase", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("sucesso", () => {
    it("should return updated vehicle DTO when update is successful", async () => {
      const vehicle = makeVehicle({ initOdometer: 1000, currentOdometer: 1000 });
      mockRepo.findById.mockResolvedValue(vehicle);
      mockRepo.update.mockImplementation(async (v) => v);

      const useCase = makeUseCase();
      const result = await useCase.execute({
        vehicleId: vehicle.id,
        accountId: vehicle.accountId,
        name: "Novo Nome",
        currentOdometer: 2000,
      });

      expect(result.vehicle.name).toBe("Novo Nome");
      expect(result.vehicle.currentOdometer).toBe(2000);
    });

    it("should call repository.update with updated entity", async () => {
      const vehicle = makeVehicle();
      mockRepo.findById.mockResolvedValue(vehicle);
      mockRepo.update.mockImplementation(async (v) => v);

      const useCase = makeUseCase();
      await useCase.execute({ vehicleId: vehicle.id, accountId: vehicle.accountId, name: "Atualizado" });

      expect(mockRepo.update).toHaveBeenCalledOnce();
    });

    it("should keep original plate when plate is not provided in update", async () => {
      const vehicle = makeVehicle();
      mockRepo.findById.mockResolvedValue(vehicle);
      mockRepo.update.mockImplementation(async (v) => v);

      const useCase = makeUseCase();
      const result = await useCase.execute({
        vehicleId: vehicle.id,
        accountId: vehicle.accountId,
        name: "Novo Nome",
      });

      expect(result.vehicle.plate).toBeNull();
    });

    it("should clear plate when plate is explicitly set to null", async () => {
      const vehicleWithPlate = Vehicle.create({
        id: "v1",
        accountId: "acc-1",
        name: VehicleName.create("Carro"),
        plate: null,
        brand: "",
        model: "",
        color: "",
        initOdometer: Odometer.create(0),
        currentOdometer: Odometer.create(0),
        createdAt: new Date("2024-01-01"),
      });
      mockRepo.findById.mockResolvedValue(vehicleWithPlate);
      mockRepo.update.mockImplementation(async (v) => v);

      const useCase = makeUseCase();
      const result = await useCase.execute({
        vehicleId: vehicleWithPlate.id,
        accountId: vehicleWithPlate.accountId,
        plate: null,
      });

      expect(result.vehicle.plate).toBeNull();
    });
  });

  describe("erro: not_found", () => {
    it("should throw BusinessRuleError with code vehicle.not_found when vehicle does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      const useCase = makeUseCase();
      await expect(
        useCase.execute({ vehicleId: "nonexistent", accountId: "acc-1" }),
      ).rejects.toMatchObject({ code: "vehicle.not_found" });
    });

    it("should not call repository.update when vehicle is not found", async () => {
      mockRepo.findById.mockResolvedValue(null);

      const useCase = makeUseCase();
      await useCase.execute({ vehicleId: "none", accountId: "acc" }).catch(() => {});

      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  describe("erro: ownership errado", () => {
    it("should throw BusinessRuleError with code vehicle.not_found when accountId does not match vehicle owner", async () => {
      const vehicle = makeVehicle({ accountId: "real-owner" });
      mockRepo.findById.mockResolvedValue(vehicle);

      const useCase = makeUseCase();
      await expect(
        useCase.execute({ vehicleId: vehicle.id, accountId: "other-account" }),
      ).rejects.toMatchObject({ code: "vehicle.not_found" });
    });
  });

  describe("erro: odômetro abaixo do init", () => {
    it("should throw BusinessRuleError with code vehicle.odometer_invalid when currentOdometer is below initOdometer", async () => {
      const vehicle = makeVehicle({ initOdometer: 5000, currentOdometer: 5000 });
      mockRepo.findById.mockResolvedValue(vehicle);

      const useCase = makeUseCase();
      await expect(
        useCase.execute({
          vehicleId: vehicle.id,
          accountId: vehicle.accountId,
          currentOdometer: 4999,
        }),
      ).rejects.toMatchObject({ code: "vehicle.odometer_invalid" });
    });

    it("should not call repository.update when odometer is below init", async () => {
      const vehicle = makeVehicle({ initOdometer: 1000, currentOdometer: 1000 });
      mockRepo.findById.mockResolvedValue(vehicle);

      const useCase = makeUseCase();
      await useCase.execute({
        vehicleId: vehicle.id,
        accountId: vehicle.accountId,
        currentOdometer: 0,
      }).catch(() => {});

      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });
});

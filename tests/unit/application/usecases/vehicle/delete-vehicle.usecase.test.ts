import { describe, it, expect, beforeEach, vi, type Mocked } from "vitest";
import { DeleteVehicleUseCase } from "@/application/usecases/vehicle/delete-vehicle.usecase";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVehicle(id = "vehicle-1", accountId = "account-1"): Vehicle {
  return Vehicle.create({
    id,
    accountId,
    name: VehicleName.create("Meu Carro"),
    plate: null,
    brand: "",
    model: "",
    color: "",
    initOdometer: Odometer.create(0),
    currentOdometer: Odometer.create(0),
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
} satisfies Mocked<VehicleRepository>;

function makeUseCase() {
  return new DeleteVehicleUseCase(mockRepo as unknown as VehicleRepository);
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("DeleteVehicleUseCase", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("sucesso", () => {
    it("should call repository.delete with vehicleId when vehicle belongs to account", async () => {
      const vehicle = makeVehicle("v1", "acc-1");
      mockRepo.findById.mockResolvedValue(vehicle);
      mockRepo.delete.mockResolvedValue(undefined);

      const useCase = makeUseCase();
      await useCase.execute({ vehicleId: "v1", accountId: "acc-1" });

      expect(mockRepo.delete).toHaveBeenCalledWith("v1");
    });

    it("should resolve without error when deletion is successful", async () => {
      const vehicle = makeVehicle();
      mockRepo.findById.mockResolvedValue(vehicle);
      mockRepo.delete.mockResolvedValue(undefined);

      const useCase = makeUseCase();
      await expect(
        useCase.execute({ vehicleId: vehicle.id, accountId: vehicle.accountId }),
      ).resolves.toBeUndefined();
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

    it("should not call repository.delete when vehicle is not found", async () => {
      mockRepo.findById.mockResolvedValue(null);

      const useCase = makeUseCase();
      await useCase.execute({ vehicleId: "none", accountId: "acc" }).catch(() => {});

      expect(mockRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe("erro: ownership errado", () => {
    it("should throw BusinessRuleError with code vehicle.not_found when accountId does not match vehicle owner", async () => {
      const vehicle = makeVehicle("v1", "real-owner");
      mockRepo.findById.mockResolvedValue(vehicle);

      const useCase = makeUseCase();
      await expect(
        useCase.execute({ vehicleId: "v1", accountId: "other-account" }),
      ).rejects.toMatchObject({ code: "vehicle.not_found" });
    });

    it("should not call repository.delete when ownership check fails", async () => {
      const vehicle = makeVehicle("v1", "real-owner");
      mockRepo.findById.mockResolvedValue(vehicle);

      const useCase = makeUseCase();
      await useCase.execute({ vehicleId: "v1", accountId: "other" }).catch(() => {});

      expect(mockRepo.delete).not.toHaveBeenCalled();
    });
  });
});

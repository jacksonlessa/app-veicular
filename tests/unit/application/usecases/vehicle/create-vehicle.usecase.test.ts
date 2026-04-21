import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreateVehicleUseCase } from "@/application/usecases/vehicle/create-vehicle.usecase";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVehicle(id: string, accountId: string): Vehicle {
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
  return new CreateVehicleUseCase(mockRepo as unknown as VehicleRepository);
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("CreateVehicleUseCase", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("sucesso", () => {
    it("should return vehicleId when vehicle is created successfully", async () => {
      const accountId = "account-1";
      const vehicle = makeVehicle("vehicle-1", accountId);

      mockRepo.findByAccount.mockResolvedValue([]);
      mockRepo.create.mockResolvedValue(vehicle);

      const useCase = makeUseCase();
      const result = await useCase.execute({ accountId, name: "Meu Carro", initOdometer: 0 });

      expect(result.vehicleId).toBeTruthy();
    });

    it("should call repository.create when input is valid", async () => {
      mockRepo.findByAccount.mockResolvedValue([]);
      mockRepo.create.mockImplementation(async (v) => v);

      const useCase = makeUseCase();
      await useCase.execute({ accountId: "acc-1", name: "Fusca", initOdometer: 10000 });

      expect(mockRepo.create).toHaveBeenCalledOnce();
    });

    it("should accept vehicle with a valid plate", async () => {
      mockRepo.findByAccount.mockResolvedValue([]);
      mockRepo.create.mockImplementation(async (v) => v);

      const useCase = makeUseCase();
      const result = await useCase.execute({ accountId: "acc-1", name: "Gol", plate: "ABC1234", initOdometer: 0 });

      expect(result.vehicleId).toBeTruthy();
    });

    it("should create vehicle with zero odometer when initOdometer is 0", async () => {
      mockRepo.findByAccount.mockResolvedValue([]);
      mockRepo.create.mockImplementation(async (v) => v);

      const useCase = makeUseCase();
      await useCase.execute({ accountId: "acc-1", name: "Moto", initOdometer: 0 });

      const created = mockRepo.create.mock.calls[0][0] as Vehicle;
      expect(created.initOdometer.value).toBe(0);
      expect(created.currentOdometer.value).toBe(0);
    });
  });

  describe("erro: limite atingido", () => {
    it("should throw BusinessRuleError with code vehicle.limit_reached when account already has 2 vehicles", async () => {
      const accountId = "acc-full";
      const v1 = makeVehicle("v1", accountId);
      const v2 = makeVehicle("v2", accountId);

      mockRepo.findByAccount.mockResolvedValue([v1, v2]);

      const useCase = makeUseCase();
      await expect(
        useCase.execute({ accountId, name: "Terceiro Carro", initOdometer: 0 }),
      ).rejects.toMatchObject({ code: "vehicle.limit_reached" });
    });

    it("should not call repository.create when limit is reached", async () => {
      const accountId = "acc-full";
      mockRepo.findByAccount.mockResolvedValue([
        makeVehicle("v1", accountId),
        makeVehicle("v2", accountId),
      ]);

      const useCase = makeUseCase();
      await useCase.execute({ accountId, name: "X", initOdometer: 0 }).catch(() => {});

      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("erro: placa inválida", () => {
    it("should throw InvalidValueError when plate format is invalid", async () => {
      mockRepo.findByAccount.mockResolvedValue([]);

      const useCase = makeUseCase();
      await expect(
        useCase.execute({ accountId: "acc-1", name: "Carro", plate: "INVALIDA", initOdometer: 0 }),
      ).rejects.toThrow(InvalidValueError);
    });

    it("should throw InvalidValueError with field Plate when plate is invalid", async () => {
      mockRepo.findByAccount.mockResolvedValue([]);

      const useCase = makeUseCase();
      let err: InvalidValueError | undefined;
      try {
        await useCase.execute({ accountId: "acc-1", name: "Carro", plate: "123", initOdometer: 0 });
      } catch (e) {
        err = e as InvalidValueError;
      }

      expect(err?.field).toBe("Plate");
    });
  });

  describe("erro: odômetro inválido", () => {
    it("should throw InvalidValueError when initOdometer is negative", async () => {
      mockRepo.findByAccount.mockResolvedValue([]);

      const useCase = makeUseCase();
      await expect(
        useCase.execute({ accountId: "acc-1", name: "Carro", initOdometer: -1 }),
      ).rejects.toThrow(InvalidValueError);
    });

    it("should throw InvalidValueError when initOdometer is a float", async () => {
      mockRepo.findByAccount.mockResolvedValue([]);

      const useCase = makeUseCase();
      await expect(
        useCase.execute({ accountId: "acc-1", name: "Carro", initOdometer: 1.5 }),
      ).rejects.toThrow(InvalidValueError);
    });

    it("should throw InvalidValueError with field Odometer when value is invalid", async () => {
      mockRepo.findByAccount.mockResolvedValue([]);

      let err: InvalidValueError | undefined;
      const useCase = makeUseCase();
      try {
        await useCase.execute({ accountId: "acc-1", name: "Carro", initOdometer: -100 });
      } catch (e) {
        err = e as InvalidValueError;
      }

      expect(err?.field).toBe("Odometer");
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ListVehiclesUseCase } from "@/application/usecases/vehicle/list-vehicles.usecase";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";
import { Plate } from "@/domain/vehicle/value-objects/plate.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVehicle(id: string, accountId: string, plate?: string): Vehicle {
  return Vehicle.create({
    id,
    accountId,
    name: VehicleName.create(`Carro ${id}`),
    plate: plate ? Plate.create(plate) : null,
    brand: "",
    model: "",
    color: "",
    initOdometer: Odometer.create(0),
    currentOdometer: Odometer.create(1000),
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
  return new ListVehiclesUseCase(mockRepo as unknown as VehicleRepository);
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("ListVehiclesUseCase", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("lista vazia", () => {
    it("should return empty vehicles array when account has no vehicles", async () => {
      mockRepo.findByAccount.mockResolvedValue([]);

      const useCase = makeUseCase();
      const result = await useCase.execute({ accountId: "acc-1" });

      expect(result.vehicles).toHaveLength(0);
    });

    it("should call repository.findByAccount with correct accountId", async () => {
      mockRepo.findByAccount.mockResolvedValue([]);

      const useCase = makeUseCase();
      await useCase.execute({ accountId: "acc-42" });

      expect(mockRepo.findByAccount).toHaveBeenCalledWith("acc-42");
    });
  });

  describe("lista com veículos", () => {
    it("should return 2 vehicle DTOs when account has 2 vehicles", async () => {
      const v1 = makeVehicle("v1", "acc-1", "ABC1234");
      const v2 = makeVehicle("v2", "acc-1");
      mockRepo.findByAccount.mockResolvedValue([v1, v2]);

      const useCase = makeUseCase();
      const result = await useCase.execute({ accountId: "acc-1" });

      expect(result.vehicles).toHaveLength(2);
    });

    it("should map vehicle fields to DTO correctly", async () => {
      const vehicle = makeVehicle("v1", "acc-1", "ABC1234");
      mockRepo.findByAccount.mockResolvedValue([vehicle]);

      const useCase = makeUseCase();
      const result = await useCase.execute({ accountId: "acc-1" });

      const dto = result.vehicles[0];
      expect(dto.id).toBe("v1");
      expect(dto.name).toBe("Carro v1");
      expect(dto.plate).toBe("ABC1234");
      expect(dto.initOdometer).toBe(0);
      expect(dto.currentOdometer).toBe(1000);
      expect(dto.createdAt).toBe("2024-01-01T00:00:00.000Z");
    });

    it("should map plate as null when vehicle has no plate", async () => {
      const vehicle = makeVehicle("v2", "acc-1");
      mockRepo.findByAccount.mockResolvedValue([vehicle]);

      const useCase = makeUseCase();
      const result = await useCase.execute({ accountId: "acc-1" });

      expect(result.vehicles[0].plate).toBeNull();
    });

    it("should preserve order returned by repository", async () => {
      const v1 = makeVehicle("first", "acc-1");
      const v2 = makeVehicle("second", "acc-1");
      mockRepo.findByAccount.mockResolvedValue([v1, v2]);

      const useCase = makeUseCase();
      const result = await useCase.execute({ accountId: "acc-1" });

      expect(result.vehicles[0].id).toBe("first");
      expect(result.vehicles[1].id).toBe("second");
    });
  });
});

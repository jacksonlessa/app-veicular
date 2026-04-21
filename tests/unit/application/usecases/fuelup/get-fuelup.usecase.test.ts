import { describe, it, expect, beforeEach, vi, type Mocked } from "vitest";
import { GetFuelupUseCase } from "@/application/usecases/fuelup/get-fuelup.usecase";
import type { FuelupRepository } from "@/domain/fuel/repositories/fuelup.repository";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import { FuelAmount } from "@/domain/fuel/value-objects/fuel-amount.vo";
import { FuelDate } from "@/domain/fuel/value-objects/fuel-date.vo";
import { FuelPrice } from "@/domain/fuel/value-objects/fuel-price.vo";
import { Kml } from "@/domain/fuel/value-objects/kml.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFuelup(id: string, vehicleId: string, kmPerLiter?: number): Fuelup {
  const liters = 40;
  const pricePerLiter = 5;
  const totalPrice = Math.round(liters * pricePerLiter * 100) / 100;
  return Fuelup.rehydrate({
    id,
    vehicleId,
    userId: "user-1",
    date: FuelDate.create(new Date("2024-01-01T10:00:00Z")),
    odometer: Odometer.create(10500),
    fuelType: "Etanol",
    fullTank: true,
    liters: FuelAmount.create(liters),
    pricePerLiter: FuelPrice.create(pricePerLiter),
    totalPrice: FuelPrice.create(totalPrice),
    kmPerLiter: kmPerLiter != null ? Kml.create(kmPerLiter) : null,
    createdAt: new Date("2024-01-01T10:00:00Z"),
  });
}

function makeVehicle(id: string, accountId: string): Vehicle {
  return Vehicle.create({
    id,
    accountId,
    name: VehicleName.create("Carro"),
    plate: null,
    brand: "",
    model: "",
    color: "",
    initOdometer: Odometer.create(0),
    currentOdometer: Odometer.create(10500),
    createdAt: new Date("2024-01-01T00:00:00Z"),
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

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

function makeUseCase() {
  return new GetFuelupUseCase(
    mockFuelupRepo as unknown as FuelupRepository,
    mockVehicleRepo as unknown as VehicleRepository,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GetFuelupUseCase", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("happy path: returns fuelup DTO for owned vehicle", async () => {
    const fuelup = makeFuelup("f1", "v1", 12.5);
    const vehicle = makeVehicle("v1", "acc-1");
    mockFuelupRepo.findById.mockResolvedValue(fuelup);
    mockVehicleRepo.findById.mockResolvedValue(vehicle);

    const result = await makeUseCase().execute({ accountId: "acc-1", fuelupId: "f1" });

    expect(result.id).toBe("f1");
    expect(result.fuelType).toBe("Etanol");
    expect(result.odometer).toBe(10500);
    expect(result.liters).toBe(40);
    expect(result.pricePerLiter).toBe(5);
    expect(result.totalPrice).toBe(200);
    expect(result.kmPerLiter).toBe(12.5);
    expect(result.fullTank).toBe(true);
    expect(typeof result.date).toBe("string");
  });

  it("returns kmPerLiter as null when not set", async () => {
    const fuelup = makeFuelup("f2", "v1");
    const vehicle = makeVehicle("v1", "acc-1");
    mockFuelupRepo.findById.mockResolvedValue(fuelup);
    mockVehicleRepo.findById.mockResolvedValue(vehicle);

    const result = await makeUseCase().execute({ accountId: "acc-1", fuelupId: "f2" });

    expect(result.kmPerLiter).toBeNull();
  });

  it("throws fuelup.not_found when fuelup does not exist", async () => {
    mockFuelupRepo.findById.mockResolvedValue(null);

    await expect(
      makeUseCase().execute({ accountId: "acc-1", fuelupId: "missing" }),
    ).rejects.toThrow("fuelup.not_found");
  });

  it("throws vehicle.not_owned when vehicle belongs to another account", async () => {
    const fuelup = makeFuelup("f1", "v1");
    const vehicle = makeVehicle("v1", "acc-other");
    mockFuelupRepo.findById.mockResolvedValue(fuelup);
    mockVehicleRepo.findById.mockResolvedValue(vehicle);

    await expect(
      makeUseCase().execute({ accountId: "acc-1", fuelupId: "f1" }),
    ).rejects.toThrow("vehicle.not_owned");
  });

  it("throws vehicle.not_owned when vehicle is not found", async () => {
    const fuelup = makeFuelup("f1", "v1");
    mockFuelupRepo.findById.mockResolvedValue(fuelup);
    mockVehicleRepo.findById.mockResolvedValue(null);

    await expect(
      makeUseCase().execute({ accountId: "acc-1", fuelupId: "f1" }),
    ).rejects.toThrow("vehicle.not_owned");
  });
});

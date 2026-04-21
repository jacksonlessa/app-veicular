import { describe, it, expect, beforeEach, vi, type Mocked } from "vitest";
import { ListFuelupsUseCase } from "@/application/usecases/fuelup/list-fuelups.usecase";
import type { FuelupRepository } from "@/domain/fuel/repositories/fuelup.repository";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import { FuelAmount } from "@/domain/fuel/value-objects/fuel-amount.vo";
import { FuelDate } from "@/domain/fuel/value-objects/fuel-date.vo";
import { FuelPrice } from "@/domain/fuel/value-objects/fuel-price.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFuelup(id: string, vehicleId: string): Fuelup {
  const liters = 40;
  const pricePerLiter = 5;
  const totalPrice = Math.round(liters * pricePerLiter * 100) / 100;
  return Fuelup.rehydrate({
    id,
    vehicleId,
    userId: "user-1",
    date: FuelDate.create(new Date("2024-01-01T10:00:00Z")),
    odometer: Odometer.create(10000),
    fuelType: "Gasolina",
    fullTank: true,
    liters: FuelAmount.create(liters),
    pricePerLiter: FuelPrice.create(pricePerLiter),
    totalPrice: FuelPrice.create(totalPrice),
    kmPerLiter: null,
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
    currentOdometer: Odometer.create(10000),
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
  return new ListFuelupsUseCase(
    mockFuelupRepo as unknown as FuelupRepository,
    mockVehicleRepo as unknown as VehicleRepository,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ListFuelupsUseCase", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("happy path: returns items and total for owned vehicle", async () => {
    const vehicle = makeVehicle("v1", "acc-1");
    const fuelup = makeFuelup("f1", "v1");
    mockVehicleRepo.findById.mockResolvedValue(vehicle);
    mockFuelupRepo.findByVehiclePaginated.mockResolvedValue({
      items: [fuelup],
      total: 1,
    });

    const result = await makeUseCase().execute({
      accountId: "acc-1",
      vehicleId: "v1",
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("f1");
    expect(result.items[0].liters).toBe(40);
    expect(result.items[0].pricePerLiter).toBe(5);
    expect(result.items[0].totalPrice).toBe(200);
    expect(result.items[0].kmPerLiter).toBeNull();
    expect(typeof result.items[0].date).toBe("string");
  });

  it("uses default page=1 and pageSize=20 when not provided", async () => {
    const vehicle = makeVehicle("v1", "acc-1");
    mockVehicleRepo.findById.mockResolvedValue(vehicle);
    mockFuelupRepo.findByVehiclePaginated.mockResolvedValue({ items: [], total: 0 });

    await makeUseCase().execute({ accountId: "acc-1", vehicleId: "v1" });

    expect(mockFuelupRepo.findByVehiclePaginated).toHaveBeenCalledWith("v1", 1, 20);
  });

  it("uses provided page and pageSize", async () => {
    const vehicle = makeVehicle("v1", "acc-1");
    mockVehicleRepo.findById.mockResolvedValue(vehicle);
    mockFuelupRepo.findByVehiclePaginated.mockResolvedValue({ items: [], total: 0 });

    await makeUseCase().execute({ accountId: "acc-1", vehicleId: "v1", page: 2, pageSize: 5 });

    expect(mockFuelupRepo.findByVehiclePaginated).toHaveBeenCalledWith("v1", 2, 5);
  });

  it("throws vehicle.not_found when vehicle does not exist", async () => {
    mockVehicleRepo.findById.mockResolvedValue(null);

    await expect(
      makeUseCase().execute({ accountId: "acc-1", vehicleId: "v-missing" }),
    ).rejects.toThrow(BusinessRuleError);

    await expect(
      makeUseCase().execute({ accountId: "acc-1", vehicleId: "v-missing" }),
    ).rejects.toThrow("vehicle.not_found");
  });

  it("throws vehicle.not_owned when vehicle belongs to another account", async () => {
    const vehicle = makeVehicle("v1", "acc-other");
    mockVehicleRepo.findById.mockResolvedValue(vehicle);

    await expect(
      makeUseCase().execute({ accountId: "acc-1", vehicleId: "v1" }),
    ).rejects.toThrow("vehicle.not_owned");
  });
});

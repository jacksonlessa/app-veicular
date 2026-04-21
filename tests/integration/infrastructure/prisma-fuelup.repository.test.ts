import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import {
  PrismaFuelupRepository,
} from "@/infrastructure/database/repositories/prisma-fuelup.repository";
import { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import { FuelDate } from "@/domain/fuel/value-objects/fuel-date.vo";
import { FuelAmount } from "@/domain/fuel/value-objects/fuel-amount.vo";
import { FuelPrice } from "@/domain/fuel/value-objects/fuel-price.vo";
import { Kml } from "@/domain/fuel/value-objects/kml.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";

// ---------------------------------------------------------------------------
// Test database setup — SQLite file separado para integração
// ---------------------------------------------------------------------------

const TEST_DB_PATH = path.resolve(__dirname, "../../.test-fuelup.db");
const TEST_DATABASE_URL = `file:${TEST_DB_PATH}`;

let prisma: PrismaClient;
let repo: PrismaFuelupRepository;

const ACCOUNT_ID = "test-account-fuelup-integration";
const USER_ID = "test-user-fuelup-integration";
const VEHICLE_ID = "test-vehicle-fuelup-integration";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDate(isoStr: string): Date {
  return new Date(isoStr);
}

function makeFuelup(overrides?: {
  id?: string;
  vehicleId?: string;
  userId?: string;
  date?: Date;
  odometer?: number;
  fuelType?: string;
  fullTank?: boolean;
  liters?: number;
  pricePerLiter?: number;
  totalPrice?: number;
  kmPerLiter?: number | null;
  createdAt?: Date;
}): Fuelup {
  const liters = overrides?.liters ?? 40;
  const pricePerLiter = overrides?.pricePerLiter ?? 5;
  const totalPrice = overrides?.totalPrice ?? liters * pricePerLiter;

  return Fuelup.rehydrate({
    id: overrides?.id ?? crypto.randomUUID(),
    vehicleId: overrides?.vehicleId ?? VEHICLE_ID,
    userId: overrides?.userId ?? USER_ID,
    date: FuelDate.create(overrides?.date ?? makeDate("2024-01-15T10:00:00.000Z")),
    odometer: Odometer.create(overrides?.odometer ?? 10000),
    fuelType: overrides?.fuelType ?? "gasoline",
    fullTank: overrides?.fullTank ?? true,
    liters: FuelAmount.create(liters),
    pricePerLiter: FuelPrice.create(pricePerLiter),
    totalPrice: FuelPrice.create(totalPrice),
    kmPerLiter: overrides?.kmPerLiter != null ? Kml.create(overrides.kmPerLiter) : null,
    createdAt: overrides?.createdAt ?? new Date("2024-01-15T10:00:00.000Z"),
  });
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeAll(async () => {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe",
  });

  prisma = new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } });
  repo = new PrismaFuelupRepository(prisma);

  // Seed account, user, vehicle (FK requirements)
  await prisma.account.create({ data: { id: ACCOUNT_ID, name: "Test Account Fuelup" } });
  await prisma.user.create({
    data: {
      id: USER_ID,
      email: "test-fuelup@test.com",
      name: "Test User",
      accountId: ACCOUNT_ID,
      passwordHash: "hash-placeholder",
    },
  });
  await prisma.vehicle.create({
    data: {
      id: VEHICLE_ID,
      accountId: ACCOUNT_ID,
      name: "Test Vehicle",
      initOdometer: 0,
      currentOdometer: 0,
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

beforeEach(async () => {
  await prisma.fuelup.deleteMany({ where: { vehicleId: VEHICLE_ID } });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PrismaFuelupRepository", () => {
  describe("create()", () => {
    it("should persist fuelup and return entity with correct fields", async () => {
      const fuelup = makeFuelup({ odometer: 10000, liters: 40, pricePerLiter: 5 });

      const result = await repo.create(fuelup);

      expect(result.id).toBe(fuelup.id);
      expect(result.vehicleId).toBe(VEHICLE_ID);
      expect(result.userId).toBe(USER_ID);
      expect(result.odometer.value).toBe(10000);
      expect(result.liters.value).toBe(40);
      expect(result.pricePerLiter.value).toBe(5);
      expect(result.totalPrice.value).toBe(200);
      expect(result.kmPerLiter).toBeNull();
    });

    it("should persist fuelup with kmPerLiter when provided", async () => {
      const fuelup = makeFuelup({ kmPerLiter: 12.5 });

      const result = await repo.create(fuelup);

      expect(result.kmPerLiter?.value).toBe(12.5);
    });
  });

  describe("findById()", () => {
    it("should return fuelup by id", async () => {
      const fuelup = makeFuelup();
      await repo.create(fuelup);

      const found = await repo.findById(fuelup.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(fuelup.id);
    });

    it("should return null for unknown id", async () => {
      const found = await repo.findById("nonexistent-id");
      expect(found).toBeNull();
    });
  });

  describe("findByVehicle()", () => {
    it("should return empty array when vehicle has no fuelups", async () => {
      const result = await repo.findByVehicle(VEHICLE_ID);
      expect(result).toHaveLength(0);
    });

    it("should return fuelups in canonical order (date ASC, odometer ASC, createdAt ASC)", async () => {
      // Insert in reverse order to ensure ordering is from DB
      const f3 = makeFuelup({
        id: "f3",
        date: makeDate("2024-03-01T10:00:00.000Z"),
        odometer: 12000,
        createdAt: new Date("2024-03-01T10:00:00.000Z"),
      });
      const f1 = makeFuelup({
        id: "f1",
        date: makeDate("2024-01-01T10:00:00.000Z"),
        odometer: 10000,
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      });
      const f2 = makeFuelup({
        id: "f2",
        date: makeDate("2024-02-01T10:00:00.000Z"),
        odometer: 11000,
        createdAt: new Date("2024-02-01T10:00:00.000Z"),
      });

      await repo.create(f3);
      await repo.create(f1);
      await repo.create(f2);

      const result = await repo.findByVehicle(VEHICLE_ID);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("f1");
      expect(result[1].id).toBe("f2");
      expect(result[2].id).toBe("f3");
    });
  });

  describe("findByVehiclePaginated()", () => {
    it("should return correct page and total", async () => {
      for (let i = 1; i <= 5; i++) {
        await repo.create(
          makeFuelup({
            id: `fp${i}`,
            odometer: 10000 + i * 500,
            date: new Date(`2024-0${i}-01T10:00:00.000Z`),
            createdAt: new Date(`2024-0${i}-01T10:00:00.000Z`),
          }),
        );
      }

      const page1 = await repo.findByVehiclePaginated(VEHICLE_ID, 1, 3);
      expect(page1.total).toBe(5);
      expect(page1.items).toHaveLength(3);
      expect(page1.items[0].id).toBe("fp1");

      const page2 = await repo.findByVehiclePaginated(VEHICLE_ID, 2, 3);
      expect(page2.total).toBe(5);
      expect(page2.items).toHaveLength(2);
      expect(page2.items[0].id).toBe("fp4");
    });
  });

  describe("findLastByVehicle()", () => {
    it("should return null when vehicle has no fuelups", async () => {
      const result = await repo.findLastByVehicle(VEHICLE_ID);
      expect(result).toBeNull();
    });

    it("should return the fuelup with the highest odometer", async () => {
      // f2 has lower date but higher odometer — findLastByVehicle should return f2
      const f1 = makeFuelup({
        id: "last-f1",
        date: makeDate("2024-03-01T10:00:00.000Z"),
        odometer: 15000,
      });
      const f2 = makeFuelup({
        id: "last-f2",
        date: makeDate("2024-01-01T10:00:00.000Z"),
        odometer: 20000,
      });

      await repo.create(f1);
      await repo.create(f2);

      const result = await repo.findLastByVehicle(VEHICLE_ID);
      expect(result?.id).toBe("last-f2");
      expect(result?.odometer.value).toBe(20000);
    });
  });

  describe("update()", () => {
    it("should update fuelup fields and return updated entity", async () => {
      const fuelup = makeFuelup({ odometer: 10000 });
      await repo.create(fuelup);

      const updated = Fuelup.rehydrate({
        id: fuelup.id,
        vehicleId: fuelup.vehicleId,
        userId: fuelup.userId,
        date: fuelup.date,
        odometer: Odometer.create(11000),
        fuelType: fuelup.fuelType,
        fullTank: fuelup.fullTank,
        liters: fuelup.liters,
        pricePerLiter: fuelup.pricePerLiter,
        totalPrice: fuelup.totalPrice,
        kmPerLiter: Kml.create(10.5),
        createdAt: fuelup.createdAt,
      });

      const result = await repo.update(updated);

      expect(result.odometer.value).toBe(11000);
      expect(result.kmPerLiter?.value).toBe(10.5);
    });

    it("should allow setting kmPerLiter to null (nullable update)", async () => {
      const fuelup = makeFuelup({ kmPerLiter: 12.5 });
      await repo.create(fuelup);

      const updated = Fuelup.rehydrate({
        ...{
          id: fuelup.id,
          vehicleId: fuelup.vehicleId,
          userId: fuelup.userId,
          date: fuelup.date,
          odometer: fuelup.odometer,
          fuelType: fuelup.fuelType,
          fullTank: fuelup.fullTank,
          liters: fuelup.liters,
          pricePerLiter: fuelup.pricePerLiter,
          totalPrice: fuelup.totalPrice,
          createdAt: fuelup.createdAt,
        },
        kmPerLiter: null,
      });

      const result = await repo.update(updated);
      expect(result.kmPerLiter).toBeNull();
    });
  });

  describe("delete()", () => {
    it("should remove fuelup from database", async () => {
      const fuelup = makeFuelup();
      await repo.create(fuelup);

      await repo.delete(fuelup.id);

      const found = await repo.findById(fuelup.id);
      expect(found).toBeNull();
    });

    it("should only delete the specified fuelup, leaving others intact", async () => {
      const f1 = makeFuelup({ id: "del-f1", odometer: 10000 });
      const f2 = makeFuelup({
        id: "del-f2",
        odometer: 11000,
        date: makeDate("2024-02-01T10:00:00.000Z"),
        createdAt: new Date("2024-02-01T10:00:00.000Z"),
      });
      await repo.create(f1);
      await repo.create(f2);

      await repo.delete("del-f1");

      const remaining = await repo.findByVehicle(VEHICLE_ID);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe("del-f2");
    });
  });
});

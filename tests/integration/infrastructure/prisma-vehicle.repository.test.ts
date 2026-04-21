import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { PrismaVehicleRepository } from "@/infrastructure/database/repositories/prisma-vehicle.repository";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";
import { Plate } from "@/domain/vehicle/value-objects/plate.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";

// ---------------------------------------------------------------------------
// Test database setup — SQLite file separado para integração
// ---------------------------------------------------------------------------

const TEST_DB_PATH = path.resolve(__dirname, "../../.test-vehicle.db");
const TEST_DATABASE_URL = `file:${TEST_DB_PATH}`;

let prisma: PrismaClient;
let repo: PrismaVehicleRepository;

// Account stub — necessário por FK
const ACCOUNT_ID = "test-account-vehicle-integration";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVehicle(overrides?: {
  id?: string;
  accountId?: string;
  initOdometer?: number;
  currentOdometer?: number;
  plate?: string;
  name?: string;
  createdAt?: Date;
}): Vehicle {
  const init = overrides?.initOdometer ?? 0;
  const current = overrides?.currentOdometer ?? init;
  return Vehicle.create({
    id: overrides?.id ?? crypto.randomUUID(),
    accountId: overrides?.accountId ?? ACCOUNT_ID,
    name: VehicleName.create(overrides?.name ?? "Meu Veículo"),
    plate: overrides?.plate ? Plate.create(overrides.plate) : null,
    brand: "",
    model: "",
    color: "",
    initOdometer: Odometer.create(init),
    currentOdometer: Odometer.create(current),
    createdAt: overrides?.createdAt,
  });
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // Remove existing test DB if present
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  // Run migrations against test DB
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe",
  });

  prisma = new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } });
  repo = new PrismaVehicleRepository(prisma);

  // Seed a test account (FK requirement)
  await prisma.account.create({ data: { id: ACCOUNT_ID, name: "Test Account" } });
});

afterAll(async () => {
  await prisma.$disconnect();
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

beforeEach(async () => {
  // Clean vehicles between tests
  await prisma.vehicle.deleteMany({ where: { accountId: ACCOUNT_ID } });
});

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("PrismaVehicleRepository", () => {
  describe("create()", () => {
    it("should persist vehicle and return entity with correct fields", async () => {
      const vehicle = makeVehicle({ plate: "ABC1234", initOdometer: 500, currentOdometer: 1000 });

      const result = await repo.create(vehicle);

      expect(result.id).toBe(vehicle.id);
      expect(result.accountId).toBe(ACCOUNT_ID);
      expect(result.name.value).toBe("Meu Veículo");
      expect(result.plate?.value).toBe("ABC1234");
      expect(result.initOdometer.value).toBe(500);
      expect(result.currentOdometer.value).toBe(1000);
    });

    it("should persist vehicle in database so it can be found by id", async () => {
      const vehicle = makeVehicle();
      await repo.create(vehicle);

      const found = await repo.findById(vehicle.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(vehicle.id);
    });

    it("should persist vehicle without plate when plate is null", async () => {
      const vehicle = makeVehicle();
      await repo.create(vehicle);

      const found = await repo.findById(vehicle.id);
      expect(found?.plate).toBeNull();
    });
  });

  describe("findByAccount()", () => {
    it("should return empty array when account has no vehicles", async () => {
      const result = await repo.findByAccount(ACCOUNT_ID);
      expect(result).toHaveLength(0);
    });

    it("should return vehicles belonging to the account", async () => {
      await repo.create(makeVehicle({ name: "Carro A" }));
      await repo.create(makeVehicle({ name: "Carro B" }));

      const result = await repo.findByAccount(ACCOUNT_ID);
      expect(result).toHaveLength(2);
    });

    it("should ignore soft-deleted vehicles (deletedAt != null)", async () => {
      const vehicle = makeVehicle();
      await repo.create(vehicle);

      // Soft delete diretamente via Prisma para simular estado
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { deletedAt: new Date() },
      });

      const result = await repo.findByAccount(ACCOUNT_ID);
      expect(result).toHaveLength(0);
    });

    it("should order vehicles by createdAt ascending", async () => {
      const older = makeVehicle({ name: "Antigo", createdAt: new Date("2024-01-01T00:00:00.000Z") });
      const newer = makeVehicle({ name: "Novo", createdAt: new Date("2024-06-01T00:00:00.000Z") });

      // Insert newer first to ensure order is from DB, not insertion order
      await repo.create(newer);
      await repo.create(older);

      const result = await repo.findByAccount(ACCOUNT_ID);
      expect(result[0].name.value).toBe("Antigo");
      expect(result[1].name.value).toBe("Novo");
    });
  });

  describe("delete()", () => {
    it("should set deletedAt without removing the database row", async () => {
      const vehicle = makeVehicle();
      await repo.create(vehicle);

      await repo.delete(vehicle.id);

      const raw = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
      expect(raw).not.toBeNull();
      expect(raw?.deletedAt).not.toBeNull();
    });

    it("should hide deleted vehicle from findByAccount", async () => {
      const vehicle = makeVehicle();
      await repo.create(vehicle);

      await repo.delete(vehicle.id);

      const remaining = await repo.findByAccount(ACCOUNT_ID);
      expect(remaining).toHaveLength(0);
    });

    it("should hide deleted vehicle from findById", async () => {
      const vehicle = makeVehicle();
      await repo.create(vehicle);

      await repo.delete(vehicle.id);

      const found = await repo.findById(vehicle.id);
      expect(found).toBeNull();
    });
  });

  describe("update()", () => {
    it("should persist new name when name is updated", async () => {
      const vehicle = makeVehicle({ name: "Original" });
      await repo.create(vehicle);

      const updated = Vehicle.rehydrate({
        id: vehicle.id,
        accountId: vehicle.accountId,
        name: VehicleName.create("Atualizado"),
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        initOdometer: vehicle.initOdometer,
        currentOdometer: vehicle.currentOdometer,
        createdAt: vehicle.createdAt,
      });
      await repo.update(updated);

      const found = await repo.findById(vehicle.id);
      expect(found?.name.value).toBe("Atualizado");
    });

    it("should persist new currentOdometer value", async () => {
      const vehicle = makeVehicle({ initOdometer: 0, currentOdometer: 0 });
      await repo.create(vehicle);

      const updated = Vehicle.rehydrate({
        id: vehicle.id,
        accountId: vehicle.accountId,
        name: vehicle.name,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        initOdometer: vehicle.initOdometer,
        currentOdometer: Odometer.create(9999),
        createdAt: vehicle.createdAt,
      });
      await repo.update(updated);

      const found = await repo.findById(vehicle.id);
      expect(found?.currentOdometer.value).toBe(9999);
    });

    it("should persist plate update and return updated entity", async () => {
      const vehicle = makeVehicle();
      await repo.create(vehicle);

      const updated = Vehicle.rehydrate({
        id: vehicle.id,
        accountId: vehicle.accountId,
        name: vehicle.name,
        plate: Plate.create("XYZ9E87"),
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        initOdometer: vehicle.initOdometer,
        currentOdometer: vehicle.currentOdometer,
        createdAt: vehicle.createdAt,
      });
      const result = await repo.update(updated);

      expect(result.plate?.value).toBe("XYZ9E87");
    });
  });
});

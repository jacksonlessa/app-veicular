import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { PrismaMaintenanceRepository } from "@/infrastructure/database/repositories/prisma-maintenance.repository";

// ---------------------------------------------------------------------------
// Test database setup — SQLite file separado para integração
// ---------------------------------------------------------------------------

const TEST_DB_PATH = path.resolve(__dirname, "../../.test-maintenance.db");
const TEST_DATABASE_URL = `file:${TEST_DB_PATH}`;

let prisma: PrismaClient;
let repo: PrismaMaintenanceRepository;

const ACCOUNT_ID = "test-account-maintenance-integration";
const USER_ID = "test-user-maintenance-integration";
const VEHICLE_ID = "test-vehicle-maintenance-integration";

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
  repo = new PrismaMaintenanceRepository(prisma);

  await prisma.account.create({ data: { id: ACCOUNT_ID, name: "Test Account" } });
  await prisma.user.create({
    data: {
      id: USER_ID,
      accountId: ACCOUNT_ID,
      name: "Test User",
      email: "test-maintenance@example.com",
      passwordHash: "hash",
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
  await prisma.maintenance.deleteMany({ where: { vehicleId: VEHICLE_ID } });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function seedMaintenance(overrides?: {
  id?: string;
  date?: Date;
  odometer?: number;
  location?: string;
  totalPrice?: number;
  items?: Array<{ description: string; quantity: number; unitPrice: number; subtotal: number }>;
}) {
  const id = overrides?.id ?? crypto.randomUUID();
  const items = overrides?.items ?? [
    { description: "Troca de óleo", quantity: 1, unitPrice: 80, subtotal: 80 },
  ];
  await prisma.maintenance.create({
    data: {
      id,
      vehicleId: VEHICLE_ID,
      userId: USER_ID,
      date: overrides?.date ?? new Date("2024-01-15T12:00:00.000Z"),
      odometer: overrides?.odometer ?? 10000,
      location: overrides?.location ?? "Descrição da manutenção",
      totalPrice: overrides?.totalPrice ?? items.reduce((s, i) => s + i.subtotal, 0),
      items: { create: items },
    },
  });
  return id;
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("PrismaMaintenanceRepository", () => {
  describe("findById()", () => {
    it("should return null when maintenance does not exist", async () => {
      const result = await repo.findById("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return maintenance entity with correct fields", async () => {
      const id = await seedMaintenance({
        odometer: 12000,
        location: "Revisão geral",
        date: new Date("2024-03-01T10:00:00.000Z"),
      });

      const result = await repo.findById(id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(id);
      expect(result!.vehicleId).toBe(VEHICLE_ID);
      expect(result!.userId).toBe(USER_ID);
      expect(result!.odometer?.value).toBe(12000);
      expect(result!.location).toBe("Revisão geral");
    });

    it("should include items in the returned entity", async () => {
      const id = await seedMaintenance({
        items: [
          { description: "Filtro de ar", quantity: 1, unitPrice: 50, subtotal: 50 },
          { description: "Filtro de óleo", quantity: 1, unitPrice: 30, subtotal: 30 },
        ],
      });

      const result = await repo.findById(id);

      expect(result!.items).toHaveLength(2);
      const descriptions = result!.items.map((i) => i.description);
      expect(descriptions).toContain("Filtro de ar");
      expect(descriptions).toContain("Filtro de óleo");
    });

    it("should correctly map item quantity and unitPrice as value objects", async () => {
      const id = await seedMaintenance({
        items: [{ description: "Palheta", quantity: 2, unitPrice: 25, subtotal: 50 }],
      });

      const result = await repo.findById(id);
      const item = result!.items[0];

      expect(item.quantity.value).toBe(2);
      expect(item.unitPrice.value).toBe(25);
      expect(item.subtotal).toBe(50);
    });

    it("should map null location to empty string", async () => {
      const id = crypto.randomUUID();
      await prisma.maintenance.create({
        data: {
          id,
          vehicleId: VEHICLE_ID,
          userId: USER_ID,
          date: new Date("2024-01-15T12:00:00.000Z"),
          odometer: 10000,
          location: null,
          totalPrice: 80,
          items: { create: [{ description: "Troca de óleo", quantity: 1, unitPrice: 80, subtotal: 80 }] },
        },
      });
      const result = await repo.findById(id);
      expect(result!.location).toBe("");
    });
  });

  describe("findByVehicle()", () => {
    it("should return empty array when vehicle has no maintenances", async () => {
      const result = await repo.findByVehicle(VEHICLE_ID);
      expect(result).toHaveLength(0);
    });

    it("should return all maintenances for a vehicle", async () => {
      await seedMaintenance({ date: new Date("2024-01-01T00:00:00.000Z") });
      await seedMaintenance({ date: new Date("2024-06-01T00:00:00.000Z") });

      const result = await repo.findByVehicle(VEHICLE_ID);
      expect(result).toHaveLength(2);
    });

    it("should return maintenances ordered by date DESC", async () => {
      const earlierId = await seedMaintenance({ date: new Date("2024-01-01T00:00:00.000Z"), odometer: 5000 });
      const laterId = await seedMaintenance({ date: new Date("2024-06-01T00:00:00.000Z"), odometer: 8000 });

      const result = await repo.findByVehicle(VEHICLE_ID);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(laterId);
      expect(result[1].id).toBe(earlierId);
      expect(result[0].date.value >= result[1].date.value).toBe(true);
    });

    it("should include items for each maintenance", async () => {
      await seedMaintenance({
        items: [
          { description: "Troca de óleo", quantity: 1, unitPrice: 80, subtotal: 80 },
          { description: "Filtro", quantity: 2, unitPrice: 15, subtotal: 30 },
        ],
      });

      const result = await repo.findByVehicle(VEHICLE_ID);
      expect(result[0].items).toHaveLength(2);
    });
  });
});

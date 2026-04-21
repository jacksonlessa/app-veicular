import { describe, it, expect } from "vitest";
import {
  toEntity,
  toPersistence,
} from "@/infrastructure/database/repositories/prisma-account.repository";

// Minimal POJO that mirrors PrismaAccount row shape
const makeRow = (overrides?: Partial<{ id: string; name: string; createdAt: Date }>) => ({
  id: "acc_01",
  name: "My Account",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  ...overrides,
});

describe("PrismaAccountRepository — mappers", () => {
  describe("toEntity", () => {
    it("maps row fields to Account entity correctly", () => {
      const row = makeRow();
      const entity = toEntity(row);

      expect(entity.id).toBe(row.id);
      expect(entity.name).toBe(row.name);
      expect(entity.createdAt).toEqual(row.createdAt);
    });
  });

  describe("toPersistence", () => {
    it("maps Account entity fields to persistence object correctly", () => {
      const row = makeRow();
      const entity = toEntity(row);
      const persistence = toPersistence(entity);

      expect(persistence.id).toBe(row.id);
      expect(persistence.name).toBe(row.name);
      expect(persistence.createdAt).toEqual(row.createdAt);
    });
  });

  describe("round-trip", () => {
    it("toPersistence(toEntity(row)) returns fields equivalent to original row", () => {
      const row = makeRow();
      const result = toPersistence(toEntity(row));

      expect(result.id).toBe(row.id);
      expect(result.name).toBe(row.name);
      expect(result.createdAt).toEqual(row.createdAt);
    });

    it("preserves all row fields across multiple accounts", () => {
      const rows = [
        makeRow({ id: "acc_1", name: "Account One" }),
        makeRow({ id: "acc_2", name: "Account Two", createdAt: new Date("2025-06-15T00:00:00.000Z") }),
      ];

      for (const row of rows) {
        const result = toPersistence(toEntity(row));
        expect(result.id).toBe(row.id);
        expect(result.name).toBe(row.name);
        expect(result.createdAt).toEqual(row.createdAt);
      }
    });
  });
});

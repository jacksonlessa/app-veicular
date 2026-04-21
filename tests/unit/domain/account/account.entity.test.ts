import { describe, expect, it } from "vitest";
import { Account } from "@/domain/account/entities/account.entity";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";

describe("Account entity", () => {
  describe("create — happy path", () => {
    it("creates an account with valid inputs", () => {
      const account = Account.create({ id: "acc-1", name: "My Account" });
      expect(account.id).toBe("acc-1");
      expect(account.name).toBe("My Account");
      expect(account.createdAt).toBeInstanceOf(Date);
    });

    it("sets createdAt to a recent timestamp", () => {
      const before = Date.now();
      const account = Account.create({ id: "acc-1", name: "My Account" });
      const after = Date.now();
      expect(account.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(account.createdAt.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe("create — invalid inputs", () => {
    it("throws InvalidValueError for empty name", () => {
      expect(() => Account.create({ id: "acc-1", name: "" })).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for whitespace-only name", () => {
      expect(() => Account.create({ id: "acc-1", name: "   " })).toThrow(InvalidValueError);
    });

    it("includes the field name in the error", () => {
      let err: InvalidValueError | undefined;
      try {
        Account.create({ id: "acc-1", name: "" });
      } catch (e) {
        err = e as InvalidValueError;
      }
      expect(err?.field).toBe("Account.name");
    });
  });

  describe("rehydrate — no revalidation", () => {
    it("rehydrates without throwing even with an unusual name", () => {
      const date = new Date("2024-01-01");
      const account = Account.rehydrate({ id: "acc-2", name: "", createdAt: date });
      expect(account.id).toBe("acc-2");
      expect(account.name).toBe("");
      expect(account.createdAt).toBe(date);
    });

    it("preserves all props as provided", () => {
      const date = new Date("2023-06-15T10:30:00Z");
      const account = Account.rehydrate({ id: "acc-xyz", name: "Restored Account", createdAt: date });
      expect(account.id).toBe("acc-xyz");
      expect(account.name).toBe("Restored Account");
      expect(account.createdAt).toBe(date);
    });
  });
});

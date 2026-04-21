import { describe, expect, it } from "vitest";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { ItemQuantity } from "@/domain/maintenance/value-objects/item-quantity.vo";

describe("ItemQuantity VO", () => {
  describe("create — happy path", () => {
    it("accepts a positive integer", () => {
      const q = ItemQuantity.create(1);
      expect(q.value).toBe(1);
    });

    it("accepts a large positive integer", () => {
      const q = ItemQuantity.create(100);
      expect(q.value).toBe(100);
    });

    it("accepts a positive float", () => {
      const q = ItemQuantity.create(2.5);
      expect(q.value).toBe(2.5);
    });
  });

  describe("create — invalid inputs", () => {
    it("throws InvalidValueError for zero", () => {
      expect(() => ItemQuantity.create(0)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for negative values", () => {
      expect(() => ItemQuantity.create(-1)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for NaN", () => {
      expect(() => ItemQuantity.create(NaN)).toThrow(InvalidValueError);
    });

    it("includes 'ItemQuantity' field in error", () => {
      let err: InvalidValueError | undefined;
      try {
        ItemQuantity.create(0);
      } catch (e) {
        err = e as InvalidValueError;
      }
      expect(err?.field).toBe("ItemQuantity");
      expect(err?.input).toBe(0);
    });
  });

  describe("equals", () => {
    it("returns true for same quantity", () => {
      const a = ItemQuantity.create(5);
      const b = ItemQuantity.create(5);
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different quantities", () => {
      const a = ItemQuantity.create(5);
      const b = ItemQuantity.create(10);
      expect(a.equals(b)).toBe(false);
    });

    it("returns false when compared to null", () => {
      const a = ItemQuantity.create(5);
      expect(a.equals(null as unknown as ItemQuantity)).toBe(false);
    });
  });
});

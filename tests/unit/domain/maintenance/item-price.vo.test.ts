import { describe, expect, it } from "vitest";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { ItemPrice } from "@/domain/maintenance/value-objects/item-price.vo";

describe("ItemPrice VO", () => {
  describe("create — happy path", () => {
    it("accepts a positive integer", () => {
      const p = ItemPrice.create(50);
      expect(p.value).toBe(50);
    });

    it("accepts a positive float", () => {
      const p = ItemPrice.create(49.99);
      expect(p.value).toBe(49.99);
    });

    it("accepts a large price", () => {
      const p = ItemPrice.create(99999.99);
      expect(p.value).toBe(99999.99);
    });
  });

  describe("create — invalid inputs", () => {
    it("throws InvalidValueError for zero", () => {
      expect(() => ItemPrice.create(0)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for negative values", () => {
      expect(() => ItemPrice.create(-1)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for NaN", () => {
      expect(() => ItemPrice.create(NaN)).toThrow(InvalidValueError);
    });

    it("includes 'ItemPrice' field in error", () => {
      let err: InvalidValueError | undefined;
      try {
        ItemPrice.create(-5);
      } catch (e) {
        err = e as InvalidValueError;
      }
      expect(err?.field).toBe("ItemPrice");
      expect(err?.input).toBe(-5);
    });
  });

  describe("equals", () => {
    it("returns true for same price", () => {
      const a = ItemPrice.create(100);
      const b = ItemPrice.create(100);
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different prices", () => {
      const a = ItemPrice.create(100);
      const b = ItemPrice.create(200);
      expect(a.equals(b)).toBe(false);
    });

    it("returns false when compared to null", () => {
      const a = ItemPrice.create(100);
      expect(a.equals(null as unknown as ItemPrice)).toBe(false);
    });
  });
});

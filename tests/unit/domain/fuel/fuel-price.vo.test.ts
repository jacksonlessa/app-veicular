import { describe, expect, it } from "vitest";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { FuelPrice } from "@/domain/fuel/value-objects/fuel-price.vo";

describe("FuelPrice VO", () => {
  describe("create — happy path", () => {
    it("accepts zero (free fuel edge case)", () => {
      const p = FuelPrice.create(0);
      expect(p.value).toBe(0);
    });

    it("accepts a typical price per liter", () => {
      const p = FuelPrice.create(5.89);
      expect(p.value).toBe(5.89);
    });

    it("accepts a large total price", () => {
      const p = FuelPrice.create(500.00);
      expect(p.value).toBe(500.00);
    });
  });

  describe("create — invalid inputs", () => {
    it("throws InvalidValueError for negative values", () => {
      expect(() => FuelPrice.create(-0.01)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for large negative values", () => {
      expect(() => FuelPrice.create(-100)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for NaN", () => {
      expect(() => FuelPrice.create(NaN)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for Infinity", () => {
      expect(() => FuelPrice.create(Infinity)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for -Infinity", () => {
      expect(() => FuelPrice.create(-Infinity)).toThrow(InvalidValueError);
    });

    it("includes field name in the error", () => {
      let err: InvalidValueError | undefined;
      try {
        FuelPrice.create(-1);
      } catch (e) {
        err = e as InvalidValueError;
      }
      expect(err?.field).toBe("FuelPrice");
      expect(err?.input).toBe(-1);
    });
  });

  describe("equals", () => {
    it("returns true for two FuelPrices with the same value", () => {
      const a = FuelPrice.create(5.89);
      const b = FuelPrice.create(5.89);
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different values", () => {
      const a = FuelPrice.create(5.89);
      const b = FuelPrice.create(6.00);
      expect(a.equals(b)).toBe(false);
    });

    it("returns false when compared to null", () => {
      const a = FuelPrice.create(5.89);
      expect(a.equals(null as unknown as FuelPrice)).toBe(false);
    });
  });
});

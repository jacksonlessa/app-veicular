import { describe, expect, it } from "vitest";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { FuelAmount } from "@/domain/fuel/value-objects/fuel-amount.vo";

describe("FuelAmount VO", () => {
  describe("create — happy path", () => {
    it("accepts the minimum valid value (just above 0)", () => {
      const a = FuelAmount.create(0.01);
      expect(a.value).toBe(0.01);
    });

    it("accepts a typical fuel amount", () => {
      const a = FuelAmount.create(45.5);
      expect(a.value).toBe(45.5);
    });

    it("accepts the maximum valid value (999)", () => {
      const a = FuelAmount.create(999);
      expect(a.value).toBe(999);
    });
  });

  describe("create — invalid inputs", () => {
    it("throws InvalidValueError for zero", () => {
      expect(() => FuelAmount.create(0)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for negative values", () => {
      expect(() => FuelAmount.create(-1)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for values above 999", () => {
      expect(() => FuelAmount.create(999.01)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for 1000", () => {
      expect(() => FuelAmount.create(1000)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for NaN", () => {
      expect(() => FuelAmount.create(NaN)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for Infinity", () => {
      expect(() => FuelAmount.create(Infinity)).toThrow(InvalidValueError);
    });

    it("includes field name in the error", () => {
      let err: InvalidValueError | undefined;
      try {
        FuelAmount.create(-5);
      } catch (e) {
        err = e as InvalidValueError;
      }
      expect(err?.field).toBe("FuelAmount");
      expect(err?.input).toBe(-5);
    });
  });

  describe("equals", () => {
    it("returns true for two FuelAmounts with the same value", () => {
      const a = FuelAmount.create(50);
      const b = FuelAmount.create(50);
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different values", () => {
      const a = FuelAmount.create(50);
      const b = FuelAmount.create(60);
      expect(a.equals(b)).toBe(false);
    });

    it("returns false when compared to null", () => {
      const a = FuelAmount.create(50);
      expect(a.equals(null as unknown as FuelAmount)).toBe(false);
    });
  });
});

import { describe, expect, it } from "vitest";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";

describe("Odometer VO", () => {
  describe("create — happy path", () => {
    it("accepts zero", () => {
      const o = Odometer.create(0);
      expect(o.value).toBe(0);
    });

    it("accepts a positive integer", () => {
      const o = Odometer.create(12345);
      expect(o.value).toBe(12345);
    });

    it("accepts a large integer", () => {
      const o = Odometer.create(999999);
      expect(o.value).toBe(999999);
    });
  });

  describe("create — invalid inputs", () => {
    it("throws InvalidValueError for negative integers", () => {
      expect(() => Odometer.create(-1)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for negative large values", () => {
      expect(() => Odometer.create(-100)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for floats", () => {
      expect(() => Odometer.create(1.5)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for NaN", () => {
      expect(() => Odometer.create(NaN)).toThrow(InvalidValueError);
    });

    it("includes the original input in the error", () => {
      let err: InvalidValueError | undefined;
      try {
        Odometer.create(-1);
      } catch (e) {
        err = e as InvalidValueError;
      }
      expect(err?.field).toBe("Odometer");
      expect(err?.input).toBe(-1);
    });
  });

  describe("equals", () => {
    it("returns true for two odometers with the same value", () => {
      const a = Odometer.create(100);
      const b = Odometer.create(100);
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for odometers with different values", () => {
      const a = Odometer.create(100);
      const b = Odometer.create(200);
      expect(a.equals(b)).toBe(false);
    });

    it("returns false when compared to null", () => {
      const a = Odometer.create(100);
      expect(a.equals(null as unknown as Odometer)).toBe(false);
    });
  });
});

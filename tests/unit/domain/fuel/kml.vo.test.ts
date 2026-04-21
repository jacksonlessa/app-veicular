import { describe, expect, it } from "vitest";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { Kml } from "@/domain/fuel/value-objects/kml.vo";

describe("Kml VO", () => {
  describe("create — happy path", () => {
    it("accepts a small positive value", () => {
      const k = Kml.create(0.1);
      expect(k.value).toBe(0.1);
    });

    it("accepts a typical km/l value", () => {
      const k = Kml.create(12.5);
      expect(k.value).toBe(12.5);
    });

    it("accepts the maximum valid value (50)", () => {
      const k = Kml.create(50);
      expect(k.value).toBe(50);
    });
  });

  describe("create — invalid inputs", () => {
    it("throws InvalidValueError for zero", () => {
      expect(() => Kml.create(0)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for negative values", () => {
      expect(() => Kml.create(-1)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for values above 50", () => {
      expect(() => Kml.create(50.01)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for 51", () => {
      expect(() => Kml.create(51)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for NaN", () => {
      expect(() => Kml.create(NaN)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for Infinity", () => {
      expect(() => Kml.create(Infinity)).toThrow(InvalidValueError);
    });

    it("includes field name in the error", () => {
      let err: InvalidValueError | undefined;
      try {
        Kml.create(0);
      } catch (e) {
        err = e as InvalidValueError;
      }
      expect(err?.field).toBe("Kml");
      expect(err?.input).toBe(0);
    });
  });

  describe("equals", () => {
    it("returns true for two Kml instances with the same value", () => {
      const a = Kml.create(12.5);
      const b = Kml.create(12.5);
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different values", () => {
      const a = Kml.create(12.5);
      const b = Kml.create(15.0);
      expect(a.equals(b)).toBe(false);
    });

    it("returns false when compared to null", () => {
      const a = Kml.create(12.5);
      expect(a.equals(null as unknown as Kml)).toBe(false);
    });
  });
});

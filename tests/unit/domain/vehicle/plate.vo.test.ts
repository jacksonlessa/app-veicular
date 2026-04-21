import { describe, expect, it } from "vitest";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { Plate } from "@/domain/vehicle/value-objects/plate.vo";

describe("Plate VO", () => {
  describe("create — old format (AAA-9999)", () => {
    it("accepts lowercase plate with hyphen and normalizes it", () => {
      const p = Plate.create("abc-1234");
      expect(p.value).toBe("ABC1234");
    });

    it("accepts uppercase plate with hyphen", () => {
      const p = Plate.create("ABC-1234");
      expect(p.value).toBe("ABC1234");
    });

    it("accepts plate without hyphen", () => {
      const p = Plate.create("ABC1234");
      expect(p.value).toBe("ABC1234");
    });

    it("trims whitespace before normalization", () => {
      const p = Plate.create("  abc-1234  ");
      expect(p.value).toBe("ABC1234");
    });
  });

  describe("create — Mercosul format (AAA9A99)", () => {
    it("accepts Mercosul plate", () => {
      const p = Plate.create("ABC1D23");
      expect(p.value).toBe("ABC1D23");
    });

    it("accepts lowercase Mercosul plate and normalizes", () => {
      const p = Plate.create("abc1d23");
      expect(p.value).toBe("ABC1D23");
    });

    it("accepts Mercosul with second digit being a letter", () => {
      const p = Plate.create("XYZ9Z99");
      expect(p.value).toBe("XYZ9Z99");
    });
  });

  describe("create — invalid inputs", () => {
    it("throws InvalidValueError for too-short plate", () => {
      expect(() => Plate.create("XX-1")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for empty string", () => {
      expect(() => Plate.create("")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for plate with only numbers", () => {
      expect(() => Plate.create("1234567")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for plate with special characters", () => {
      expect(() => Plate.create("AB!-1234")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for plate with wrong letter count", () => {
      expect(() => Plate.create("AB-1234")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for plate with too many digits", () => {
      expect(() => Plate.create("ABC-12345")).toThrow(InvalidValueError);
    });

    it("includes the original input in the error", () => {
      let err: InvalidValueError | undefined;
      try {
        Plate.create("XX-1");
      } catch (e) {
        err = e as InvalidValueError;
      }
      expect(err?.field).toBe("Plate");
      expect(err?.input).toBe("XX-1");
    });
  });

  describe("equals", () => {
    it("returns true for two plates with the same normalized value", () => {
      const a = Plate.create("abc-1234");
      const b = Plate.create("ABC1234");
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for plates with different values", () => {
      const a = Plate.create("ABC1234");
      const b = Plate.create("XYZ5678");
      expect(a.equals(b)).toBe(false);
    });

    it("returns false when compared to null", () => {
      const a = Plate.create("ABC1234");
      expect(a.equals(null as unknown as Plate)).toBe(false);
    });
  });
});

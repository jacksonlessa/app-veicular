import { describe, expect, it } from "vitest";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";

describe("VehicleName VO", () => {
  describe("create — happy path", () => {
    it("accepts a simple name", () => {
      const n = VehicleName.create("Meu Carro");
      expect(n.value).toBe("Meu Carro");
    });

    it("trims whitespace", () => {
      const n = VehicleName.create("  Carro  ");
      expect(n.value).toBe("Carro");
    });

    it("accepts a name at maximum length (60 chars)", () => {
      const input = "A".repeat(60);
      const n = VehicleName.create(input);
      expect(n.value).toBe(input);
    });

    it("accepts a single character name", () => {
      const n = VehicleName.create("X");
      expect(n.value).toBe("X");
    });
  });

  describe("create — invalid inputs", () => {
    it("throws InvalidValueError for empty string", () => {
      expect(() => VehicleName.create("")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for whitespace-only string", () => {
      expect(() => VehicleName.create("   ")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for name longer than 60 chars", () => {
      expect(() => VehicleName.create("A".repeat(61))).toThrow(InvalidValueError);
    });

    it("includes the original input in the error", () => {
      let err: InvalidValueError | undefined;
      try {
        VehicleName.create("");
      } catch (e) {
        err = e as InvalidValueError;
      }
      expect(err?.field).toBe("VehicleName");
    });
  });

  describe("equals", () => {
    it("returns true for two names with the same value", () => {
      const a = VehicleName.create("Carro");
      const b = VehicleName.create("Carro");
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for names with different values", () => {
      const a = VehicleName.create("Carro A");
      const b = VehicleName.create("Carro B");
      expect(a.equals(b)).toBe(false);
    });

    it("returns false when compared to null", () => {
      const a = VehicleName.create("Carro");
      expect(a.equals(null as unknown as VehicleName)).toBe(false);
    });
  });
});

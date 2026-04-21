import { describe, expect, it } from "vitest";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { FuelDate } from "@/domain/fuel/value-objects/fuel-date.vo";

describe("FuelDate VO", () => {
  describe("create — happy path", () => {
    it("accepts the current date", () => {
      const now = new Date();
      const d = FuelDate.create(now);
      expect(d.value).toBe(now);
    });

    it("accepts a past date", () => {
      const past = new Date("2020-01-01T00:00:00Z");
      const d = FuelDate.create(past);
      expect(d.value).toBe(past);
    });

    it("accepts a date within the 60-second tolerance window in the future", () => {
      const almostNow = new Date(Date.now() + 59_000);
      const d = FuelDate.create(almostNow);
      expect(d.value).toBe(almostNow);
    });

    it("accepts a date exactly at the 60-second boundary", () => {
      const boundary = new Date(Date.now() + 60_000);
      // Should be accepted (tolerance is 60s inclusive)
      const d = FuelDate.create(boundary);
      expect(d.value).toBe(boundary);
    });
  });

  describe("create — invalid inputs", () => {
    it("throws InvalidValueError for a date more than 60 seconds in the future", () => {
      const future = new Date(Date.now() + 61_000);
      expect(() => FuelDate.create(future)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for a far-future date", () => {
      const farFuture = new Date("2099-12-31T00:00:00Z");
      expect(() => FuelDate.create(farFuture)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for an invalid Date object", () => {
      const invalid = new Date("not-a-date");
      expect(() => FuelDate.create(invalid)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for non-Date input", () => {
      expect(() => FuelDate.create("2024-01-01" as unknown as Date)).toThrow(
        InvalidValueError,
      );
    });

    it("includes field name in the error for future date", () => {
      let err: InvalidValueError | undefined;
      const future = new Date(Date.now() + 120_000);
      try {
        FuelDate.create(future);
      } catch (e) {
        err = e as InvalidValueError;
      }
      expect(err?.field).toBe("FuelDate");
    });
  });

  describe("equals", () => {
    it("returns true for two FuelDates with the same timestamp", () => {
      const date = new Date("2024-06-15T10:00:00Z");
      const a = FuelDate.create(date);
      const b = FuelDate.create(new Date("2024-06-15T10:00:00Z"));
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different dates", () => {
      const a = FuelDate.create(new Date("2024-06-15T10:00:00Z"));
      const b = FuelDate.create(new Date("2024-06-16T10:00:00Z"));
      expect(a.equals(b)).toBe(false);
    });

    it("returns false when compared to null", () => {
      const a = FuelDate.create(new Date("2024-06-15T10:00:00Z"));
      expect(a.equals(null as unknown as FuelDate)).toBe(false);
    });
  });
});

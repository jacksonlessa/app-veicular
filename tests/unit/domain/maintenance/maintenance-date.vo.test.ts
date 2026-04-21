import { describe, expect, it } from "vitest";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { MaintenanceDate } from "@/domain/maintenance/value-objects/maintenance-date.vo";

describe("MaintenanceDate VO", () => {
  describe("create — happy path", () => {
    it("accepts today's date", () => {
      const today = new Date();
      const vo = MaintenanceDate.create(today);
      expect(vo.value.getTime()).toBe(today.getTime());
    });

    it("accepts a past date", () => {
      const past = new Date("2020-01-15");
      const vo = MaintenanceDate.create(past);
      expect(vo.value.getTime()).toBe(past.getTime());
    });

    it("accepts a date string for past date", () => {
      const vo = MaintenanceDate.create("2023-06-01");
      expect(vo.value).toBeInstanceOf(Date);
    });

    it("accepts start of today as a Date object", () => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const vo = MaintenanceDate.create(startOfToday);
      expect(vo.value.getTime()).toBe(startOfToday.getTime());
    });
  });

  describe("create — invalid inputs", () => {
    it("throws InvalidValueError for a future date", () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      expect(() => MaintenanceDate.create(future)).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for an invalid date string", () => {
      expect(() => MaintenanceDate.create("not-a-date")).toThrow(InvalidValueError);
    });

    it("throws InvalidValueError for invalid Date object", () => {
      expect(() => MaintenanceDate.create(new Date("invalid"))).toThrow(InvalidValueError);
    });

    it("includes 'MaintenanceDate' field in error", () => {
      const future = new Date();
      future.setDate(future.getDate() + 2);
      let err: InvalidValueError | undefined;
      try {
        MaintenanceDate.create(future);
      } catch (e) {
        err = e as InvalidValueError;
      }
      expect(err?.field).toBe("MaintenanceDate");
    });
  });

  describe("equals", () => {
    it("returns true for two dates with the same time", () => {
      const d = new Date("2024-01-10");
      const a = MaintenanceDate.create(d);
      const b = MaintenanceDate.create(new Date(d.getTime()));
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for two dates with different times", () => {
      const a = MaintenanceDate.create(new Date("2024-01-10"));
      const b = MaintenanceDate.create(new Date("2024-01-09"));
      expect(a.equals(b)).toBe(false);
    });

    it("returns false when compared to null", () => {
      const a = MaintenanceDate.create(new Date("2024-01-10"));
      expect(a.equals(null as unknown as MaintenanceDate)).toBe(false);
    });
  });
});

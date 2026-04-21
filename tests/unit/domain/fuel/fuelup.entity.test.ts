import { describe, expect, it } from "vitest";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import { FuelAmount } from "@/domain/fuel/value-objects/fuel-amount.vo";
import { FuelDate } from "@/domain/fuel/value-objects/fuel-date.vo";
import { FuelPrice } from "@/domain/fuel/value-objects/fuel-price.vo";
import { Kml } from "@/domain/fuel/value-objects/kml.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";

function makeFuelupInput(
  overrides: Partial<Parameters<typeof Fuelup.create>[0]> = {},
) {
  return {
    id: "fuelup-1",
    vehicleId: "vehicle-1",
    userId: "user-1",
    date: FuelDate.create(new Date("2024-06-15T10:00:00Z")),
    odometer: Odometer.create(10000),
    fuelType: "Gasolina",
    fullTank: true,
    liters: FuelAmount.create(50),
    pricePerLiter: FuelPrice.create(5),
    totalPrice: FuelPrice.create(250),
    kmPerLiter: null,
    ...overrides,
  };
}

describe("Fuelup entity", () => {
  describe("create — happy path", () => {
    it("creates a fuelup with coherent total price", () => {
      const fuelup = Fuelup.create(makeFuelupInput());
      expect(fuelup.id).toBe("fuelup-1");
      expect(fuelup.vehicleId).toBe("vehicle-1");
      expect(fuelup.userId).toBe("user-1");
      expect(fuelup.fuelType).toBe("Gasolina");
      expect(fuelup.fullTank).toBe(true);
      expect(fuelup.liters.value).toBe(50);
      expect(fuelup.pricePerLiter.value).toBe(5);
      expect(fuelup.totalPrice.value).toBe(250);
      expect(fuelup.kmPerLiter).toBeNull();
    });

    it("accepts kmPerLiter as null", () => {
      const fuelup = Fuelup.create(makeFuelupInput({ kmPerLiter: null }));
      expect(fuelup.kmPerLiter).toBeNull();
    });

    it("accepts kmPerLiter as a valid Kml VO", () => {
      const kml = Kml.create(12.5);
      const fuelup = Fuelup.create(makeFuelupInput({ kmPerLiter: kml }));
      expect(fuelup.kmPerLiter?.value).toBe(12.5);
    });

    it("accepts fullTank as false", () => {
      const fuelup = Fuelup.create(makeFuelupInput({ fullTank: false }));
      expect(fuelup.fullTank).toBe(false);
    });

    it("accepts zero pricePerLiter with zero totalPrice", () => {
      const fuelup = Fuelup.create(
        makeFuelupInput({
          pricePerLiter: FuelPrice.create(0),
          totalPrice: FuelPrice.create(0),
        }),
      );
      expect(fuelup.totalPrice.value).toBe(0);
    });

    it("defaults createdAt to now when not provided", () => {
      const before = new Date();
      const fuelup = Fuelup.create(makeFuelupInput());
      const after = new Date();
      expect(fuelup.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(fuelup.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("uses provided createdAt date", () => {
      const createdAt = new Date("2024-01-01T00:00:00Z");
      const fuelup = Fuelup.create(makeFuelupInput({ createdAt }));
      expect(fuelup.createdAt).toBe(createdAt);
    });

    it("accepts a floating-point totalPrice within tolerance (0.01)", () => {
      // 10 liters * 5/liter = 50.005 due to floating point — totalPrice 50 is within 0.01
      const fuelup = Fuelup.create(
        makeFuelupInput({
          liters: FuelAmount.create(10),
          pricePerLiter: FuelPrice.create(5),
          totalPrice: FuelPrice.create(50.005),
        }),
      );
      expect(fuelup.liters.value).toBe(10);
    });
  });

  describe("create — total price coherence", () => {
    it("throws BusinessRuleError when totalPrice does not match liters * pricePerLiter", () => {
      expect(() =>
        Fuelup.create(
          makeFuelupInput({
            liters: FuelAmount.create(10),
            pricePerLiter: FuelPrice.create(5),
            totalPrice: FuelPrice.create(60), // should be 50
          }),
        ),
      ).toThrow(BusinessRuleError);
    });

    it("throws with code fuelup.total_mismatch", () => {
      let err: BusinessRuleError | undefined;
      try {
        Fuelup.create(
          makeFuelupInput({
            liters: FuelAmount.create(10),
            pricePerLiter: FuelPrice.create(5),
            totalPrice: FuelPrice.create(60),
          }),
        );
      } catch (e) {
        err = e as BusinessRuleError;
      }
      expect(err?.code).toBe("fuelup.total_mismatch");
    });

    it("throws when totalPrice is slightly over the tolerance", () => {
      // 10 * 5 = 50, but totalPrice = 50.02 (diff = 0.02 > 0.01)
      expect(() =>
        Fuelup.create(
          makeFuelupInput({
            liters: FuelAmount.create(10),
            pricePerLiter: FuelPrice.create(5),
            totalPrice: FuelPrice.create(50.02),
          }),
        ),
      ).toThrow(BusinessRuleError);
    });
  });

  describe("rehydrate", () => {
    it("rehydrates a fuelup from persisted props without re-validating total", () => {
      const createdAt = new Date("2024-01-01T00:00:00Z");
      const date = FuelDate.create(new Date("2024-01-01T08:00:00Z"));
      const props = {
        id: "fuelup-2",
        vehicleId: "vehicle-2",
        userId: "user-2",
        date,
        odometer: Odometer.create(5000),
        fuelType: "Etanol",
        fullTank: false,
        liters: FuelAmount.create(30),
        pricePerLiter: FuelPrice.create(4),
        totalPrice: FuelPrice.create(120),
        kmPerLiter: Kml.create(10),
        createdAt,
      };
      const fuelup = Fuelup.rehydrate(props);
      expect(fuelup.id).toBe("fuelup-2");
      expect(fuelup.vehicleId).toBe("vehicle-2");
      expect(fuelup.userId).toBe("user-2");
      expect(fuelup.fuelType).toBe("Etanol");
      expect(fuelup.fullTank).toBe(false);
      expect(fuelup.liters.value).toBe(30);
      expect(fuelup.pricePerLiter.value).toBe(4);
      expect(fuelup.totalPrice.value).toBe(120);
      expect(fuelup.kmPerLiter?.value).toBe(10);
      expect(fuelup.createdAt).toBe(createdAt);
    });

    it("rehydrates with null kmPerLiter", () => {
      const fuelup = Fuelup.rehydrate({
        id: "f",
        vehicleId: "v",
        userId: "u",
        date: FuelDate.create(new Date("2024-01-01T08:00:00Z")),
        odometer: Odometer.create(0),
        fuelType: "Diesel",
        fullTank: true,
        liters: FuelAmount.create(100),
        pricePerLiter: FuelPrice.create(6),
        totalPrice: FuelPrice.create(600),
        kmPerLiter: null,
        createdAt: new Date("2024-01-01T00:00:00Z"),
      });
      expect(fuelup.kmPerLiter).toBeNull();
    });
  });
});

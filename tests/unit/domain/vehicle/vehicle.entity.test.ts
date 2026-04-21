import { describe, expect, it } from "vitest";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { Plate } from "@/domain/vehicle/value-objects/plate.vo";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";

function makeProps(overrides: Partial<Parameters<typeof Vehicle.create>[0]> = {}) {
  return {
    id: "vehicle-1",
    accountId: "account-1",
    name: VehicleName.create("Meu Carro"),
    plate: Plate.create("ABC1234"),
    brand: "Toyota",
    model: "Corolla",
    color: "Prata",
    initOdometer: Odometer.create(0),
    currentOdometer: Odometer.create(1000),
    ...overrides,
  };
}

describe("Vehicle entity", () => {
  describe("create — happy path", () => {
    it("creates a vehicle with all fields", () => {
      const vehicle = Vehicle.create(makeProps());
      expect(vehicle.id).toBe("vehicle-1");
      expect(vehicle.accountId).toBe("account-1");
      expect(vehicle.name.value).toBe("Meu Carro");
      expect(vehicle.plate?.value).toBe("ABC1234");
      expect(vehicle.brand).toBe("Toyota");
      expect(vehicle.model).toBe("Corolla");
      expect(vehicle.color).toBe("Prata");
      expect(vehicle.initOdometer.value).toBe(0);
      expect(vehicle.currentOdometer.value).toBe(1000);
    });

    it("creates a vehicle with null plate", () => {
      const vehicle = Vehicle.create(makeProps({ plate: null }));
      expect(vehicle.plate).toBeNull();
    });

    it("creates a vehicle with currentOdometer equal to initOdometer", () => {
      const vehicle = Vehicle.create(
        makeProps({
          initOdometer: Odometer.create(500),
          currentOdometer: Odometer.create(500),
        }),
      );
      expect(vehicle.currentOdometer.value).toBe(500);
    });

    it("uses provided createdAt date", () => {
      const date = new Date("2024-01-01");
      const vehicle = Vehicle.create(makeProps({ createdAt: date }));
      expect(vehicle.createdAt).toBe(date);
    });

    it("defaults createdAt to now when not provided", () => {
      const before = new Date();
      const vehicle = Vehicle.create(makeProps());
      const after = new Date();
      expect(vehicle.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(vehicle.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe("create — odometer invariant", () => {
    it("throws BusinessRuleError when currentOdometer < initOdometer", () => {
      expect(() =>
        Vehicle.create(
          makeProps({
            initOdometer: Odometer.create(1000),
            currentOdometer: Odometer.create(500),
          }),
        ),
      ).toThrow(BusinessRuleError);
    });

    it("throws with code vehicle.odometer_invalid", () => {
      let err: BusinessRuleError | undefined;
      try {
        Vehicle.create(
          makeProps({
            initOdometer: Odometer.create(1000),
            currentOdometer: Odometer.create(500),
          }),
        );
      } catch (e) {
        err = e as BusinessRuleError;
      }
      expect(err?.code).toBe("vehicle.odometer_invalid");
    });
  });

  describe("rehydrate", () => {
    it("rehydrates a vehicle from persisted data", () => {
      const date = new Date("2024-01-01");
      const props = {
        id: "vehicle-2",
        accountId: "account-2",
        name: VehicleName.create("Moto"),
        plate: null,
        brand: "Honda",
        model: "CB500",
        color: "Azul",
        initOdometer: Odometer.create(0),
        currentOdometer: Odometer.create(5000),
        createdAt: date,
      };
      const vehicle = Vehicle.rehydrate(props);
      expect(vehicle.id).toBe("vehicle-2");
      expect(vehicle.currentOdometer.value).toBe(5000);
      expect(vehicle.createdAt).toBe(date);
    });

    it("throws BusinessRuleError when rehydrating with invalid odometer", () => {
      expect(() =>
        Vehicle.rehydrate({
          id: "v",
          accountId: "a",
          name: VehicleName.create("Carro"),
          plate: null,
          brand: "Ford",
          model: "Ka",
          color: "Vermelho",
          initOdometer: Odometer.create(2000),
          currentOdometer: Odometer.create(1000),
          createdAt: new Date(),
        }),
      ).toThrow(BusinessRuleError);
    });
  });
});

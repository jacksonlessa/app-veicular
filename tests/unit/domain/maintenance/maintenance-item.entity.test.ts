import { describe, expect, it } from "vitest";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { MaintenanceItem } from "@/domain/maintenance/entities/maintenance-item.entity";
import { ItemPrice } from "@/domain/maintenance/value-objects/item-price.vo";
import { ItemQuantity } from "@/domain/maintenance/value-objects/item-quantity.vo";

function makeItemInput(overrides: Partial<Parameters<typeof MaintenanceItem.create>[0]> = {}) {
  return {
    id: "item-1",
    description: "Troca de óleo",
    quantity: 1,
    unitPrice: 50,
    ...overrides,
  };
}

describe("MaintenanceItem entity", () => {
  describe("create — happy path", () => {
    it("creates with all fields", () => {
      const item = MaintenanceItem.create(makeItemInput());
      expect(item.id).toBe("item-1");
      expect(item.description).toBe("Troca de óleo");
      expect(item.quantity.value).toBe(1);
      expect(item.unitPrice.value).toBe(50);
    });

    it("trims description whitespace", () => {
      const item = MaintenanceItem.create(makeItemInput({ description: "  Filtro de ar  " }));
      expect(item.description).toBe("Filtro de ar");
    });

    it("calculates subtotal as quantity × unitPrice", () => {
      const item = MaintenanceItem.create(makeItemInput({ quantity: 2, unitPrice: 50 }));
      expect(item.subtotal).toBe(100);
    });

    it("subtotal is 0 when unitPrice is 0", () => {
      const item = MaintenanceItem.create(makeItemInput({ quantity: 3, unitPrice: 0 }));
      expect(item.subtotal).toBe(0);
    });

    it("calculates subtotal with float values", () => {
      const item = MaintenanceItem.create(makeItemInput({ quantity: 3, unitPrice: 10.5 }));
      expect(item.subtotal).toBeCloseTo(31.5, 6);
    });
  });

  describe("create — invalid inputs", () => {
    it("throws InvalidValueError for empty description", () => {
      expect(() => MaintenanceItem.create(makeItemInput({ description: "" }))).toThrow(
        InvalidValueError,
      );
    });

    it("throws InvalidValueError for whitespace-only description", () => {
      expect(() => MaintenanceItem.create(makeItemInput({ description: "   " }))).toThrow(
        InvalidValueError,
      );
    });

    it("throws InvalidValueError for quantity <= 0", () => {
      expect(() => MaintenanceItem.create(makeItemInput({ quantity: 0 }))).toThrow(
        InvalidValueError,
      );
    });

    it("throws InvalidValueError for negative quantity", () => {
      expect(() => MaintenanceItem.create(makeItemInput({ quantity: -1 }))).toThrow(
        InvalidValueError,
      );
    });

    it("throws InvalidValueError for negative unitPrice", () => {
      expect(() => MaintenanceItem.create(makeItemInput({ unitPrice: -10 }))).toThrow(
        InvalidValueError,
      );
    });
  });

  describe("rehydrate", () => {
    it("rehydrates with existing VOs", () => {
      const item = MaintenanceItem.rehydrate({
        id: "item-2",
        description: "Pneu",
        quantity: ItemQuantity.create(4),
        unitPrice: ItemPrice.create(300),
      });
      expect(item.id).toBe("item-2");
      expect(item.subtotal).toBe(1200);
    });
  });
});

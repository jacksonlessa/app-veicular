import { describe, expect, it } from "vitest";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { Maintenance } from "@/domain/maintenance/entities/maintenance.entity";
import { MaintenanceItem } from "@/domain/maintenance/entities/maintenance-item.entity";
import { MaintenanceDate } from "@/domain/maintenance/value-objects/maintenance-date.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";

function makeItem(id: string, quantity: number, unitPrice: number): MaintenanceItem {
  return MaintenanceItem.create({ id, description: "Serviço", quantity, unitPrice });
}

function makeBaseInput(
  overrides: Partial<Parameters<typeof Maintenance.create>[0]> = {},
): Parameters<typeof Maintenance.create>[0] {
  return {
    id: "maint-1",
    vehicleId: "vehicle-1",
    userId: "user-1",
    date: MaintenanceDate.create(new Date("2024-01-10")),
    odometer: Odometer.create(50000),
    location: "Oficina Central",
    items: [makeItem("item-1", 1, 100)],
    ...overrides,
  };
}

describe("Maintenance entity", () => {
  describe("create — happy path", () => {
    it("creates with all fields and one item", () => {
      const maint = Maintenance.create(makeBaseInput());
      expect(maint.id).toBe("maint-1");
      expect(maint.vehicleId).toBe("vehicle-1");
      expect(maint.userId).toBe("user-1");
      expect(maint.location).toBe("Oficina Central");
      expect(maint.items).toHaveLength(1);
    });

    it("creates with multiple items", () => {
      const maint = Maintenance.create(
        makeBaseInput({
          items: [makeItem("i1", 2, 50), makeItem("i2", 1, 150)],
        }),
      );
      expect(maint.items).toHaveLength(2);
    });

    it("uses provided createdAt", () => {
      const date = new Date("2024-01-01");
      const maint = Maintenance.create(makeBaseInput({ createdAt: date }));
      expect(maint.createdAt).toBe(date);
    });

    it("defaults createdAt to now when not provided", () => {
      const before = new Date();
      const maint = Maintenance.create(makeBaseInput());
      const after = new Date();
      expect(maint.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(maint.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe("create — no items throws", () => {
    it("throws BusinessRuleError when items array is empty", () => {
      expect(() => Maintenance.create(makeBaseInput({ items: [] }))).toThrow(BusinessRuleError);
    });

    it("throws with code 'maintenance.no_items'", () => {
      let err: BusinessRuleError | undefined;
      try {
        Maintenance.create(makeBaseInput({ items: [] }));
      } catch (e) {
        err = e as BusinessRuleError;
      }
      expect(err?.code).toBe("maintenance.no_items");
    });
  });

  describe("totalPrice", () => {
    it("calculates total as sum of all item subtotals", () => {
      const maint = Maintenance.create(
        makeBaseInput({
          items: [makeItem("i1", 2, 50), makeItem("i2", 3, 20)],
        }),
      );
      // 2 * 50 + 3 * 20 = 100 + 60 = 160
      expect(maint.totalPrice).toBe(160);
    });

    it("totalPrice for single item equals its subtotal", () => {
      const maint = Maintenance.create(makeBaseInput({ items: [makeItem("i1", 4, 25)] }));
      expect(maint.totalPrice).toBe(100);
    });
  });

  describe("addItem", () => {
    it("adds an item to the maintenance", () => {
      const maint = Maintenance.create(makeBaseInput({ items: [makeItem("i1", 1, 100)] }));
      expect(maint.items).toHaveLength(1);
      maint.addItem(makeItem("i2", 2, 75));
      expect(maint.items).toHaveLength(2);
    });

    it("updates totalPrice after addItem", () => {
      const maint = Maintenance.create(makeBaseInput({ items: [makeItem("i1", 1, 100)] }));
      expect(maint.totalPrice).toBe(100);
      maint.addItem(makeItem("i2", 2, 50));
      expect(maint.totalPrice).toBe(200);
    });

    it("multiple addItem calls accumulate correctly", () => {
      const maint = Maintenance.create(makeBaseInput({ items: [makeItem("i1", 1, 10)] }));
      maint.addItem(makeItem("i2", 1, 20));
      maint.addItem(makeItem("i3", 1, 30));
      expect(maint.totalPrice).toBe(60);
      expect(maint.items).toHaveLength(3);
    });
  });

  describe("rehydrate", () => {
    it("rehydrates without revalidation", () => {
      const maint = Maintenance.rehydrate({
        id: "maint-2",
        vehicleId: "v-2",
        userId: "u-2",
        date: MaintenanceDate.create(new Date("2023-05-20")),
        odometer: Odometer.create(30000),
        location: "Casa",
        items: [makeItem("i1", 1, 200)],
        createdAt: new Date("2023-05-20"),
      });
      expect(maint.id).toBe("maint-2");
      expect(maint.totalPrice).toBe(200);
    });
  });

  describe("getters", () => {
    it("exposes date VO", () => {
      const date = MaintenanceDate.create(new Date("2024-01-10"));
      const maint = Maintenance.create(makeBaseInput({ date }));
      expect(maint.date).toBe(date);
    });

    it("exposes odometer VO", () => {
      const odometer = Odometer.create(50000);
      const maint = Maintenance.create(makeBaseInput({ odometer }));
      expect(maint.odometer).toBe(odometer);
    });
  });

  describe("items isolation", () => {
    it("items array is isolated (internal copy)", () => {
      const originalItems = [makeItem("i1", 1, 100)];
      const maint = Maintenance.create(makeBaseInput({ items: originalItems }));
      // Pushing to original array should not affect entity
      originalItems.push(makeItem("i2", 1, 50));
      expect(maint.items).toHaveLength(1);
    });
  });
});

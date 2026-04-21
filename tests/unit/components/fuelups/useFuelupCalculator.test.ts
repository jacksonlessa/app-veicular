import { describe, expect, it } from "vitest";
import { useFuelupCalculator } from "@/components/fuelups/useFuelupCalculator";

describe("useFuelupCalculator", () => {
  describe("locked = null", () => {
    it("returns values as-is and calculated = null when no lock is set", () => {
      const result = useFuelupCalculator({
        liters: 40,
        pricePerLiter: 5.89,
        totalPrice: 235.6,
        locked: null,
      });
      expect(result.calculated).toBeNull();
      expect(result.liters).toBe(40);
      expect(result.pricePerLiter).toBe(5.89);
      expect(result.totalPrice).toBe(235.6);
    });
  });

  describe("locked = totalPrice (liters + ppl → total)", () => {
    it("calculates totalPrice from liters and pricePerLiter", () => {
      const result = useFuelupCalculator({
        liters: 40,
        pricePerLiter: 5.89,
        locked: "totalPrice",
      });
      expect(result.calculated).toBe("totalPrice");
      // 40 * 5.89 = 235.6
      expect(result.totalPrice).toBe(235.6);
    });

    it("rounds totalPrice to 2 decimal places", () => {
      const result = useFuelupCalculator({
        liters: 3,
        pricePerLiter: 1.999,
        locked: "totalPrice",
      });
      expect(result.calculated).toBe("totalPrice");
      // 3 * 1.999 = 5.997 → rounded to 6.00
      expect(result.totalPrice).toBe(6);
    });

    it("returns calculated = null when liters is missing", () => {
      const result = useFuelupCalculator({
        pricePerLiter: 5.89,
        locked: "totalPrice",
      });
      expect(result.calculated).toBeNull();
    });

    it("returns calculated = null when pricePerLiter is missing", () => {
      const result = useFuelupCalculator({
        liters: 40,
        locked: "totalPrice",
      });
      expect(result.calculated).toBeNull();
    });
  });

  describe("locked = pricePerLiter (liters + total → ppl)", () => {
    it("calculates pricePerLiter from liters and totalPrice", () => {
      const result = useFuelupCalculator({
        liters: 40,
        totalPrice: 235.6,
        locked: "pricePerLiter",
      });
      expect(result.calculated).toBe("pricePerLiter");
      // 235.6 / 40 = 5.89
      expect(result.pricePerLiter).toBe(5.89);
    });

    it("rounds pricePerLiter to 2 decimal places", () => {
      const result = useFuelupCalculator({
        liters: 3,
        totalPrice: 10,
        locked: "pricePerLiter",
      });
      expect(result.calculated).toBe("pricePerLiter");
      // 10 / 3 = 3.3333... → 3.33
      expect(result.pricePerLiter).toBe(3.33);
    });

    it("returns calculated = null when liters is missing", () => {
      const result = useFuelupCalculator({
        totalPrice: 235.6,
        locked: "pricePerLiter",
      });
      expect(result.calculated).toBeNull();
    });
  });

  describe("locked = liters (ppl + total → liters)", () => {
    it("calculates liters from pricePerLiter and totalPrice", () => {
      const result = useFuelupCalculator({
        pricePerLiter: 5.89,
        totalPrice: 235.6,
        locked: "liters",
      });
      expect(result.calculated).toBe("liters");
      // 235.6 / 5.89 ≈ 40.000
      expect(result.liters).toBeCloseTo(40, 3);
    });

    it("rounds liters to 3 decimal places", () => {
      const result = useFuelupCalculator({
        pricePerLiter: 3,
        totalPrice: 10,
        locked: "liters",
      });
      expect(result.calculated).toBe("liters");
      // 10 / 3 = 3.3333... → 3.333
      expect(result.liters).toBe(3.333);
    });

    it("returns calculated = null when totalPrice is missing", () => {
      const result = useFuelupCalculator({
        pricePerLiter: 5.89,
        locked: "liters",
      });
      expect(result.calculated).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("returns calculated = null when a required field is zero", () => {
      const result = useFuelupCalculator({
        liters: 0,
        pricePerLiter: 5.89,
        locked: "totalPrice",
      });
      expect(result.calculated).toBeNull();
    });

    it("returns calculated = null when a required field is NaN", () => {
      const result = useFuelupCalculator({
        liters: NaN,
        pricePerLiter: 5.89,
        locked: "totalPrice",
      });
      expect(result.calculated).toBeNull();
    });
  });
});

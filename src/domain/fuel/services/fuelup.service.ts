import { FuelAmount } from "@/domain/fuel/value-objects/fuel-amount.vo";
import { FuelPrice } from "@/domain/fuel/value-objects/fuel-price.vo";
import { Kml } from "@/domain/fuel/value-objects/kml.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";

export type FuelupInput = {
  liters?: FuelAmount;
  pricePerLiter?: FuelPrice;
  totalPrice?: FuelPrice;
  currentOdometer: Odometer;
  currentFullTank: boolean;
  previous?: { odometer: Odometer; fullTank: boolean } | null;
};

export type FuelupComputed = {
  liters: FuelAmount;
  pricePerLiter: FuelPrice;
  totalPrice: FuelPrice;
  kml: Kml | null;
};

export class FuelupService {
  static compute(input: FuelupInput): FuelupComputed {
    const { liters, pricePerLiter, totalPrice, currentOdometer, currentFullTank, previous } = input;

    const filled = [liters, pricePerLiter, totalPrice].filter(
      (v) => v !== undefined && v !== null,
    ).length;

    if (filled !== 2) {
      throw new BusinessRuleError("fuelup.three_fields");
    }

    let computedLiters: FuelAmount;
    let computedPricePerLiter: FuelPrice;
    let computedTotalPrice: FuelPrice;

    if (liters !== undefined && pricePerLiter !== undefined) {
      // Calculate totalPrice = liters * pricePerLiter
      const total = Math.round(liters.value * pricePerLiter.value * 100) / 100;
      computedLiters = liters;
      computedPricePerLiter = pricePerLiter;
      computedTotalPrice = FuelPrice.create(total);
    } else if (liters !== undefined && totalPrice !== undefined) {
      // Calculate pricePerLiter = totalPrice / liters
      const ppl = Math.round((totalPrice.value / liters.value) * 100) / 100;
      computedLiters = liters;
      computedPricePerLiter = FuelPrice.create(ppl);
      computedTotalPrice = totalPrice;
    } else {
      // pricePerLiter + totalPrice → liters = totalPrice / pricePerLiter
      const l = Math.round((totalPrice!.value / pricePerLiter!.value) * 1000) / 1000;
      computedLiters = FuelAmount.create(l);
      computedPricePerLiter = pricePerLiter!;
      computedTotalPrice = totalPrice!;
    }

    // Calculate kml conditionally
    let kml: Kml | null = null;

    if (
      previous !== null &&
      previous !== undefined &&
      previous.fullTank &&
      currentFullTank
    ) {
      if (previous.odometer.value >= currentOdometer.value) {
        throw new BusinessRuleError("odometer.not_increasing");
      }
      const distance = currentOdometer.value - previous.odometer.value;
      const kmlValue = distance / computedLiters.value;
      kml = Kml.create(kmlValue);
    }

    return {
      liters: computedLiters,
      pricePerLiter: computedPricePerLiter,
      totalPrice: computedTotalPrice,
      kml,
    };
  }
}

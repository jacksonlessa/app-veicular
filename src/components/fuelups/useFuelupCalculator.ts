/**
 * Hook that mirrors FuelupService.compute rounding rules on the client side.
 * Given any two of the three fuel fields, it derives the third automatically.
 *
 * locked: the field the user last manually edited (the "free" one).
 * The field that is NOT locked and NOT one of the other two typed fields is the
 * calculated one. When locked is null, nothing is derived.
 */
export type FuelField = "liters" | "pricePerLiter" | "totalPrice";

export interface UseFuelupCalculatorInput {
  liters?: number;
  pricePerLiter?: number;
  totalPrice?: number;
  /**
   * The field currently locked as "calculated" (read-only, derived).
   * null means no field is being auto-calculated yet.
   */
  locked: FuelField | null;
}

export interface UseFuelupCalculatorOutput {
  liters?: number;
  pricePerLiter?: number;
  totalPrice?: number;
  /** Which field is currently being auto-calculated (null if not enough data). */
  calculated: FuelField | null;
}

function roundPrice(v: number): number {
  return Math.round(v * 100) / 100;
}

function roundLiters(v: number): number {
  return Math.round(v * 1000) / 1000;
}

export function useFuelupCalculator(
  input: UseFuelupCalculatorInput
): UseFuelupCalculatorOutput {
  const { liters, pricePerLiter, totalPrice, locked } = input;

  // If the user has not locked any field yet, or all three are provided, return as-is.
  if (locked === null) {
    return { liters, pricePerLiter, totalPrice, calculated: null };
  }

  // Determine which two fields are "user-provided" (not locked)
  const hasLiters = liters !== undefined && liters !== null && !isNaN(liters) && liters > 0;
  const hasPpl = pricePerLiter !== undefined && pricePerLiter !== null && !isNaN(pricePerLiter) && pricePerLiter > 0;
  const hasTotal = totalPrice !== undefined && totalPrice !== null && !isNaN(totalPrice) && totalPrice > 0;

  // locked field is the one to be derived from the other two
  if (locked === "totalPrice" && hasLiters && hasPpl) {
    const computed = roundPrice(liters! * pricePerLiter!);
    return { liters, pricePerLiter, totalPrice: computed, calculated: "totalPrice" };
  }

  if (locked === "pricePerLiter" && hasLiters && hasTotal) {
    const computed = roundPrice(totalPrice! / liters!);
    return { liters, pricePerLiter: computed, totalPrice, calculated: "pricePerLiter" };
  }

  if (locked === "liters" && hasPpl && hasTotal) {
    const computed = roundLiters(totalPrice! / pricePerLiter!);
    return { liters: computed, pricePerLiter, totalPrice, calculated: "liters" };
  }

  // Not enough data to compute yet
  return { liters, pricePerLiter, totalPrice, calculated: null };
}

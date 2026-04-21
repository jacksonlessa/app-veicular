import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { ValueObject } from "@/domain/shared/value-objects/value-object";

export class FuelPrice extends ValueObject<number> {
  private constructor(value: number) {
    super(value);
  }

  static create(v: number): FuelPrice {
    if (!Number.isFinite(v) || v < 0) {
      throw new InvalidValueError("FuelPrice", v);
    }
    return new FuelPrice(v);
  }
}

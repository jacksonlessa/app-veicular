import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { ValueObject } from "@/domain/shared/value-objects/value-object";

export class FuelAmount extends ValueObject<number> {
  private constructor(value: number) {
    super(value);
  }

  static create(v: number): FuelAmount {
    if (!Number.isFinite(v) || v <= 0 || v > 999) {
      throw new InvalidValueError("FuelAmount", v);
    }
    return new FuelAmount(v);
  }
}

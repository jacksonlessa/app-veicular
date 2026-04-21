import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { ValueObject } from "@/domain/shared/value-objects/value-object";

const TOLERANCE_MS = 60_000; // 60 seconds clock skew tolerance

export class FuelDate extends ValueObject<Date> {
  private constructor(value: Date) {
    super(value);
  }

  static create(d: Date): FuelDate {
    if (!(d instanceof Date) || isNaN(d.getTime())) {
      throw new InvalidValueError("FuelDate", d);
    }
    const now = Date.now();
    if (d.getTime() > now + TOLERANCE_MS) {
      throw new InvalidValueError("FuelDate", d);
    }
    return new FuelDate(d);
  }

  equals(other: ValueObject<Date>): boolean {
    return (
      other?.constructor === this.constructor &&
      other.value instanceof Date &&
      other.value.getTime() === this.value.getTime()
    );
  }
}

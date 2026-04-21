import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { ValueObject } from "@/domain/shared/value-objects/value-object";

export class Odometer extends ValueObject<number> {
  private constructor(value: number) {
    super(value);
  }

  static create(input: number): Odometer {
    if (!Number.isInteger(input) || input < 0) {
      throw new InvalidValueError("Odometer", input);
    }
    return new Odometer(input);
  }
}

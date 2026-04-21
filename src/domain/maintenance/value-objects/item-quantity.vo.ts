import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { ValueObject } from "@/domain/shared/value-objects/value-object";

export class ItemQuantity extends ValueObject<number> {
  private constructor(value: number) {
    super(value);
  }

  static create(input: number): ItemQuantity {
    if (typeof input !== "number" || isNaN(input) || input <= 0) {
      throw new InvalidValueError("ItemQuantity", input);
    }
    return new ItemQuantity(input);
  }

  static rehydrate(value: number): ItemQuantity {
    return new ItemQuantity(value);
  }
}

import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { ValueObject } from "@/domain/shared/value-objects/value-object";

export class ItemPrice extends ValueObject<number> {
  private constructor(value: number) {
    super(value);
  }

  static create(input: number): ItemPrice {
    if (typeof input !== "number" || isNaN(input) || input <= 0) {
      throw new InvalidValueError("ItemPrice", input);
    }
    return new ItemPrice(input);
  }

  static rehydrate(value: number): ItemPrice {
    return new ItemPrice(value);
  }
}

import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { ValueObject } from "@/domain/shared/value-objects/value-object";

export class Plate extends ValueObject<string> {
  private static readonly RE_OLD = /^[A-Z]{3}\d{4}$/;
  private static readonly RE_MERCOSUL = /^[A-Z]{3}\d[A-Z]\d{2}$/;

  private constructor(value: string) {
    super(value);
  }

  static create(input: string): Plate {
    const normalized = input?.trim().toUpperCase().replace(/-/g, "");
    if (
      !normalized ||
      (!Plate.RE_OLD.test(normalized) && !Plate.RE_MERCOSUL.test(normalized))
    ) {
      throw new InvalidValueError("Plate", input);
    }
    return new Plate(normalized);
  }
}

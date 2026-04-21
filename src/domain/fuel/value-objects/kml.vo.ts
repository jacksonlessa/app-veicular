import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { ValueObject } from "@/domain/shared/value-objects/value-object";

export class Kml extends ValueObject<number> {
  private constructor(value: number) {
    super(value);
  }

  static create(v: number): Kml {
    if (!Number.isFinite(v) || v <= 0 || v > 50) {
      throw new InvalidValueError("Kml", v);
    }
    return new Kml(v);
  }
}

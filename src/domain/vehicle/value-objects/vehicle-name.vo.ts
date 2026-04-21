import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { ValueObject } from "@/domain/shared/value-objects/value-object";

export class VehicleName extends ValueObject<string> {
  private static readonly MAX_LENGTH = 60;

  private constructor(value: string) {
    super(value);
  }

  static create(input: string): VehicleName {
    const trimmed = input?.trim();
    if (!trimmed || trimmed.length > VehicleName.MAX_LENGTH) {
      throw new InvalidValueError("VehicleName", input);
    }
    return new VehicleName(trimmed);
  }
}

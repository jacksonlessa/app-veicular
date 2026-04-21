import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { ValueObject } from "@/domain/shared/value-objects/value-object";

export class MaintenanceDate extends ValueObject<Date> {
  private constructor(value: Date) {
    super(value);
  }

  static create(input: Date | string): MaintenanceDate {
    const date = input instanceof Date ? input : new Date(input);

    if (isNaN(date.getTime())) {
      throw new InvalidValueError("MaintenanceDate", input);
    }

    const now = new Date();
    // Compare only to start of day to allow today's date
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inputDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (inputDay > startOfToday) {
      throw new InvalidValueError("MaintenanceDate", input);
    }

    return new MaintenanceDate(date);
  }

  static rehydrate(raw: Date): MaintenanceDate {
    return new MaintenanceDate(raw);
  }

  equals(other: ValueObject<Date>): boolean {
    return (
      other?.constructor === this.constructor &&
      other.value.getTime() === this.value.getTime()
    );
  }
}

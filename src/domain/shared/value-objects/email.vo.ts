import { InvalidValueError } from "../errors/invalid-value.error";
import { ValueObject } from "./value-object";

export class Email extends ValueObject<string> {
  private static readonly RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(value: string) {
    super(value);
  }

  static create(input: string): Email {
    const v = input?.trim().toLowerCase();
    if (!v || !Email.RE.test(v)) throw new InvalidValueError("Email", input);
    return new Email(v);
  }
}

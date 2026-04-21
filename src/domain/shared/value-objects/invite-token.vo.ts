import { InvalidValueError } from "../errors/invalid-value.error";
import { ValueObject } from "./value-object";

export class InviteToken extends ValueObject<string> {
  private static readonly RE = /^[0-9a-f]{32,}$/i;

  private constructor(value: string) {
    super(value);
  }

  static create(input: string): InviteToken {
    const v = input?.trim();
    if (!v || !InviteToken.RE.test(v))
      throw new InvalidValueError("InviteToken", input);
    return new InviteToken(v);
  }
}

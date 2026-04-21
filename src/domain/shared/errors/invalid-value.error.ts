import { DomainError } from "./domain.error";

export class InvalidValueError extends DomainError {
  constructor(
    public readonly field: string,
    public readonly input: unknown,
  ) {
    super(`Invalid value for ${field}: ${String(input)}`);
  }
}

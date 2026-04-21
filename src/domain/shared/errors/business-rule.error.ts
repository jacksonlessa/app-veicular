import { DomainError } from "./domain.error";

export class BusinessRuleError extends DomainError {
  constructor(
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

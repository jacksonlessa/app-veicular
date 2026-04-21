import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";

export interface AccountProps {
  id: string;
  name: string;
  createdAt: Date;
}

export class Account {
  private constructor(private props: AccountProps) {}

  static create(input: { id: string; name: string }): Account {
    if (!input.name?.trim()) throw new InvalidValueError("Account.name", input.name);
    return new Account({ ...input, createdAt: new Date() });
  }

  static rehydrate(props: AccountProps): Account {
    return new Account(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}

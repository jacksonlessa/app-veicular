import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { Email } from "@/domain/shared/value-objects/email.vo";

export interface UserProps {
  id: string;
  accountId: string;
  name: string;
  email: Email;
  passwordHash: string;
  createdAt: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  static create(input: {
    id: string;
    accountId: string;
    name: string;
    email: Email;
    passwordHash: string;
  }): User {
    if (!input.name?.trim()) throw new InvalidValueError("User.name", input.name);
    if (!input.passwordHash) throw new InvalidValueError("User.passwordHash", "empty");
    return new User({ ...input, createdAt: new Date() });
  }

  static rehydrate(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}

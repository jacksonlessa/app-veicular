import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { Account } from "@/domain/account/entities/account.entity";
import { User } from "@/domain/account/entities/user.entity";
import type { AccountRepository } from "@/domain/account/repositories/account.repository";
import type { UserRepository } from "@/domain/account/repositories/user.repository";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { Email } from "@/domain/shared/value-objects/email.vo";
import type { PasswordHasher } from "@/infrastructure/auth/password-hasher";
import { MIN_PASSWORD_LEN } from "./constants";

export interface RegisterAccountInput {
  name: string;
  email: string;
  password: string;
}

export interface RegisterAccountOutput {
  userId: string;
  accountId: string;
}

export class RegisterAccountUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly accounts: AccountRepository,
    private readonly hasher: PasswordHasher,
    // prisma is kept for future atomic $transaction support
    // TODO (débito técnico): quando os repositórios aceitarem TransactionClient
    // como parâmetro opcional, substituir as chamadas abaixo por um único
    // prisma.$transaction que persiste Account e User atomicamente.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readonly _prisma: PrismaClient,
  ) {}

  async execute(input: RegisterAccountInput): Promise<RegisterAccountOutput> {
    const email = Email.create(input.email);

    if (input.password.length < MIN_PASSWORD_LEN) {
      throw new InvalidValueError("password", "too_short");
    }

    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new BusinessRuleError("email.duplicate");
    }

    const passwordHash = await this.hasher.hash(input.password);

    const accountId = randomUUID();
    const userId = randomUUID();

    const account = Account.create({ id: accountId, name: input.name });
    await this.accounts.create(account);

    const user = User.create({ id: userId, accountId, name: input.name, email, passwordHash });
    await this.users.create(user);

    return { userId, accountId };
  }
}

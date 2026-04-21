import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { AccountRepository } from "@/domain/account/repositories/account.repository";
import type { UserRepository } from "@/domain/account/repositories/user.repository";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { Email } from "@/domain/shared/value-objects/email.vo";
import type { PasswordHasher } from "@/application/ports/password-hasher";
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
    private readonly prisma: PrismaClient,
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
    const now = new Date();

    // MVP: repos não aceitam TransactionClient; usamos operações brutas dentro
    // do $transaction para garantir atomicidade de Account + User.
    await this.prisma.$transaction(async (tx) => {
      await tx.account.create({ data: { id: accountId, name: input.name, createdAt: now } });
      await tx.user.create({
        data: { id: userId, accountId, name: input.name, email: email.value, passwordHash, createdAt: now },
      });
    });

    return { userId, accountId };
  }
}

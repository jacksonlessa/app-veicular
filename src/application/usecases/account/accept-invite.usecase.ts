import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { InviteRepository } from "@/domain/account/repositories/invite.repository";
import type { UserRepository } from "@/domain/account/repositories/user.repository";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { InviteToken } from "@/domain/shared/value-objects/invite-token.vo";
import type { PasswordHasher } from "@/application/ports/password-hasher";
import { MIN_PASSWORD_LEN } from "./constants";

export interface AcceptInviteInput {
  token: string;
  name: string;
  password: string;
}

export interface AcceptInviteOutput {
  userId: string;
  accountId: string;
}

export class AcceptInviteUseCase {
  constructor(
    private readonly invites: InviteRepository,
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(input: AcceptInviteInput): Promise<AcceptInviteOutput> {
    const t = InviteToken.create(input.token);

    const invite = await this.invites.findByToken(t);
    if (!invite) throw new BusinessRuleError("invite.not_found");

    if (!invite.isUsable(new Date()))
      throw new BusinessRuleError("invite.expired_or_used");

    if (input.password.length < MIN_PASSWORD_LEN)
      throw new InvalidValueError("password", "too_short");

    if ((await this.users.countByAccount(invite.accountId)) >= 2)
      throw new BusinessRuleError("invite.account_full");

    const passwordHash = await this.hasher.hash(input.password);
    const userId = randomUUID();
    const now = new Date();

    // MVP: repos não aceitam TransactionClient; usamos operações brutas dentro
    // do $transaction para garantir atomicidade de User.create + Invite.update.
    await this.prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          accountId: invite.accountId,
          name: input.name,
          email: invite.email.value,
          passwordHash,
          createdAt: now,
        },
      });
      await tx.invite.update({
        where: { id: invite.id },
        data: { status: "accepted" },
      });
    });

    return { userId, accountId: invite.accountId };
  }
}

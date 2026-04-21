import { randomUUID } from "node:crypto";
import { User } from "@/domain/account/entities/user.entity";
import type { InviteRepository } from "@/domain/account/repositories/invite.repository";
import type { UserRepository } from "@/domain/account/repositories/user.repository";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { InviteToken } from "@/domain/shared/value-objects/invite-token.vo";
import type { PasswordHasher } from "@/infrastructure/auth/password-hasher";
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
    const user = User.create({
      id: randomUUID(),
      accountId: invite.accountId,
      name: input.name,
      email: invite.email,
      passwordHash,
    });

    await this.users.create(user);

    invite.markAccepted();
    await this.invites.update(invite);

    return { userId: user.id, accountId: invite.accountId };
  }
}

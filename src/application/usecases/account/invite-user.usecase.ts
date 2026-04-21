import { randomUUID } from "node:crypto";
import { Invite } from "@/domain/account/entities/invite.entity";
import type { AccountRepository } from "@/domain/account/repositories/account.repository";
import type { InviteRepository } from "@/domain/account/repositories/invite.repository";
import type { UserRepository } from "@/domain/account/repositories/user.repository";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { Email } from "@/domain/shared/value-objects/email.vo";
import { InviteToken } from "@/domain/shared/value-objects/invite-token.vo";
import type { Mailer } from "@/application/ports/mailer";
import type { TokenGenerator } from "@/application/ports/token-generator";
import { INVITE_TTL_HOURS } from "./constants";

export interface InviteUserInput {
  accountId: string;
  inviterUserId: string;
  email: string;
}

export interface InviteUserOutput {
  inviteId: string;
}

export class InviteUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly accounts: AccountRepository,
    private readonly invites: InviteRepository,
    private readonly mailer: Mailer,
    private readonly tokenGenerator: TokenGenerator,
    private readonly baseUrl: string,
  ) {}

  async execute(input: InviteUserInput): Promise<InviteUserOutput> {
    const emailVO = Email.create(input.email);

    const account = await this.accounts.findById(input.accountId);
    if (!account) {
      throw new BusinessRuleError("account.not_found");
    }

    const count = await this.users.countByAccount(input.accountId);
    if (count >= 2) {
      throw new BusinessRuleError("invite.account_full");
    }

    const existingUser = await this.users.findByEmail(emailVO);
    if (existingUser) {
      if (existingUser.accountId === input.accountId) {
        throw new BusinessRuleError("invite.already_member");
      } else {
        throw new BusinessRuleError("invite.email_in_use");
      }
    }

    const activePending = await this.invites.findActivePending(input.accountId, emailVO);
    if (activePending) {
      throw new BusinessRuleError("invite.already_pending");
    }

    const token = this.tokenGenerator.generate();
    const invite = Invite.create({
      id: randomUUID(),
      accountId: input.accountId,
      email: emailVO,
      token: InviteToken.create(token),
      ttlHours: INVITE_TTL_HOURS,
    });

    await this.invites.create(invite);

    const inviterUser = await this.users.findById(input.inviterUserId);
    const inviterName = inviterUser?.name ?? "Membro da conta";

    await this.mailer.sendInvite({
      to: emailVO,
      inviterName,
      accountName: account.name,
      acceptUrl: `${this.baseUrl}/convite/${token}`,
    });

    return { inviteId: invite.id };
  }
}

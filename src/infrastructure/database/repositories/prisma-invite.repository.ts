import type { PrismaClient, Invite as PrismaInvite } from "@prisma/client";
import { Invite, type InviteStatus } from "@/domain/account/entities/invite.entity";
import type { InviteRepository } from "@/domain/account/repositories/invite.repository";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { Email } from "@/domain/shared/value-objects/email.vo";
import { InviteToken } from "@/domain/shared/value-objects/invite-token.vo";

const VALID_STATUSES: InviteStatus[] = ["pending", "accepted", "expired"];

export function toEntity(row: PrismaInvite): Invite {
  const status = row.status as InviteStatus;
  if (!VALID_STATUSES.includes(status)) {
    throw new InvalidValueError("InviteStatus", row.status);
  }
  return Invite.rehydrate({
    id: row.id,
    accountId: row.accountId,
    email: Email.create(row.email),
    token: InviteToken.create(row.token),
    status,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  });
}

export function toPersistence(invite: Invite): {
  id: string;
  accountId: string;
  email: string;
  token: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
} {
  return {
    id: invite.id,
    accountId: invite.accountId,
    email: invite.email.value,
    token: invite.token.value,
    status: invite.status,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
  };
}

export class PrismaInviteRepository implements InviteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByToken(token: InviteToken): Promise<Invite | null> {
    const row = await this.prisma.invite.findUnique({
      where: { token: token.value },
    });
    return row ? toEntity(row) : null;
  }

  async findActivePending(accountId: string, email: Email): Promise<Invite | null> {
    const now = new Date();
    const row = await this.prisma.invite.findFirst({
      where: {
        accountId,
        email: email.value,
        status: "pending",
        expiresAt: { gt: now },
      },
    });
    return row ? toEntity(row) : null;
  }

  async create(invite: Invite): Promise<Invite> {
    try {
      const data = toPersistence(invite);
      const row = await this.prisma.invite.create({ data });
      return toEntity(row);
    } catch (e: unknown) {
      if (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code: unknown }).code === "P2002"
      ) {
        throw new BusinessRuleError("invite.token_duplicate");
      }
      throw e;
    }
  }

  async update(invite: Invite): Promise<Invite> {
    const data = toPersistence(invite);
    const row = await this.prisma.invite.update({
      where: { id: invite.id },
      data: {
        status: data.status,
        expiresAt: data.expiresAt,
      },
    });
    return toEntity(row);
  }
}

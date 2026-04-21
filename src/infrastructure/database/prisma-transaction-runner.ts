import type { PrismaClient } from "@prisma/client";
import type {
  TransactionRunner,
  CreateAccountWithOwnerData,
  AcceptInviteTransactionData,
} from "@/application/ports/transaction-runner";

export class PrismaTransactionRunner implements TransactionRunner {
  constructor(private readonly prisma: PrismaClient) {}

  async createAccountWithOwner(data: CreateAccountWithOwnerData): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.account.create({
        data: { id: data.accountId, name: data.accountName, createdAt: data.now },
      });
      await tx.user.create({
        data: {
          id: data.userId,
          accountId: data.accountId,
          name: data.userName,
          email: data.email,
          passwordHash: data.passwordHash,
          createdAt: data.now,
        },
      });
    });
  }

  async acceptInvite(data: AcceptInviteTransactionData): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: data.userId,
          accountId: data.accountId,
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          createdAt: data.now,
        },
      });
      await tx.invite.update({
        where: { id: data.inviteId },
        data: { status: data.status },
      });
    });
  }
}

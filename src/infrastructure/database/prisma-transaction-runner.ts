import type { PrismaClient } from "@prisma/client";
import type {
  TransactionRunner,
  CreateAccountWithOwnerData,
  AcceptInviteTransactionData,
  SaveFuelupData,
  DeleteFuelupData,
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

  async saveFuelup(data: SaveFuelupData): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (data.mode === "create") {
        await tx.fuelup.create({ data: data.fuelup });
      } else {
        const { id, ...rest } = data.fuelup;
        await tx.fuelup.update({ where: { id }, data: rest });
      }
      for (const r of data.recomputed) {
        await tx.fuelup.update({ where: { id: r.id }, data: { kmPerLiter: r.kmPerLiter } });
      }
      await tx.vehicle.update({
        where: { id: data.vehicleId },
        data: { currentOdometer: data.newCurrentOdometer },
      });
    });
  }

  async deleteFuelup(data: DeleteFuelupData): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.fuelup.delete({ where: { id: data.fuelupId } });
      for (const r of data.recomputed) {
        await tx.fuelup.update({ where: { id: r.id }, data: { kmPerLiter: r.kmPerLiter } });
      }
      await tx.vehicle.update({
        where: { id: data.vehicleId },
        data: { currentOdometer: data.newCurrentOdometer },
      });
    });
  }
}

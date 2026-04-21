import type { PrismaClient, Account as PrismaAccount } from "@prisma/client";
import { Account } from "@/domain/account/entities/account.entity";
import type { AccountRepository } from "@/domain/account/repositories/account.repository";

export function toEntity(row: PrismaAccount): Account {
  return Account.rehydrate({
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
  });
}

export function toPersistence(account: Account): {
  id: string;
  name: string;
  createdAt: Date;
} {
  return {
    id: account.id,
    name: account.name,
    createdAt: account.createdAt,
  };
}

export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Account | null> {
    const row = await this.prisma.account.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async create(account: Account): Promise<Account> {
    const data = toPersistence(account);
    const row = await this.prisma.account.create({ data });
    return toEntity(row);
  }
}

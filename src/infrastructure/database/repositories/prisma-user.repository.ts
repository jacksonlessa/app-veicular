import type { PrismaClient, User as PrismaUser } from "@prisma/client";
import { User } from "@/domain/account/entities/user.entity";
import type { UserRepository } from "@/domain/account/repositories/user.repository";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { Email } from "@/domain/shared/value-objects/email.vo";

export function toEntity(row: PrismaUser): User {
  return User.rehydrate({
    id: row.id,
    accountId: row.accountId,
    name: row.name,
    email: Email.create(row.email),
    passwordHash: row.passwordHash,
    createdAt: row.createdAt,
  });
}

export function toPersistence(user: User): {
  id: string;
  accountId: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
} {
  return {
    id: user.id,
    accountId: user.accountId,
    name: user.name,
    email: user.email.value,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
  };
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.value },
    });
    return row ? toEntity(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async countByAccount(accountId: string): Promise<number> {
    return this.prisma.user.count({ where: { accountId } });
  }

  async create(user: User): Promise<User> {
    try {
      const row = await this.prisma.user.create({ data: toPersistence(user) });
      return toEntity(row);
    } catch (e: unknown) {
      if (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code: unknown }).code === "P2002"
      ) {
        throw new BusinessRuleError("email.duplicate");
      }
      throw e;
    }
  }
}

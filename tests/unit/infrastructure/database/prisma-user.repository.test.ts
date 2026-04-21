import { describe, it, expect, vi } from "vitest";
import {
  toEntity,
  toPersistence,
  PrismaUserRepository,
} from "@/infrastructure/database/repositories/prisma-user.repository";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { Email } from "@/domain/shared/value-objects/email.vo";
import { User } from "@/domain/account/entities/user.entity";

// Minimal POJO that mirrors PrismaUser row shape
const makeRow = (overrides?: Partial<{
  id: string;
  accountId: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}>) => ({
  id: "usr_01",
  accountId: "acc_01",
  name: "Alice",
  email: "alice@example.com",
  passwordHash: "$argon2id$hashed",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  ...overrides,
});

describe("PrismaUserRepository — mappers", () => {
  describe("toEntity", () => {
    it("maps row fields to User entity correctly", () => {
      const row = makeRow();
      const entity = toEntity(row);

      expect(entity.id).toBe(row.id);
      expect(entity.accountId).toBe(row.accountId);
      expect(entity.name).toBe(row.name);
      expect(entity.email.value).toBe(row.email);
      expect(entity.passwordHash).toBe(row.passwordHash);
      expect(entity.createdAt).toEqual(row.createdAt);
    });

    it("normalizes email to lowercase", () => {
      const row = makeRow({ email: "Alice@Example.COM" });
      const entity = toEntity(row);
      expect(entity.email.value).toBe("alice@example.com");
    });
  });

  describe("toPersistence", () => {
    it("maps User entity fields to persistence object correctly", () => {
      const row = makeRow();
      const entity = toEntity(row);
      const persistence = toPersistence(entity);

      expect(persistence.id).toBe(row.id);
      expect(persistence.accountId).toBe(row.accountId);
      expect(persistence.name).toBe(row.name);
      expect(persistence.email).toBe(row.email);
      expect(persistence.passwordHash).toBe(row.passwordHash);
      expect(persistence.createdAt).toEqual(row.createdAt);
    });
  });

  describe("round-trip", () => {
    it("toPersistence(toEntity(row)) returns fields equivalent to original row", () => {
      const row = makeRow();
      const result = toPersistence(toEntity(row));

      expect(result.id).toBe(row.id);
      expect(result.accountId).toBe(row.accountId);
      expect(result.name).toBe(row.name);
      expect(result.email).toBe(row.email);
      expect(result.passwordHash).toBe(row.passwordHash);
      expect(result.createdAt).toEqual(row.createdAt);
    });
  });
});

describe("PrismaUserRepository — create", () => {
  it("translates Prisma P2002 unique constraint error to BusinessRuleError('email.duplicate')", async () => {
    const prismaError = Object.assign(new Error("Unique constraint failed"), {
      code: "P2002",
    });

    const mockPrisma = {
      user: {
        create: vi.fn().mockRejectedValue(prismaError),
      },
    };

    const repo = new PrismaUserRepository(mockPrisma as never);

    const user = User.rehydrate({
      id: "usr_01",
      accountId: "acc_01",
      name: "Alice",
      email: Email.create("alice@example.com"),
      passwordHash: "$argon2id$hashed",
      createdAt: new Date(),
    });

    await expect(repo.create(user)).rejects.toThrow(BusinessRuleError);
    await expect(repo.create(user)).rejects.toMatchObject({ code: "email.duplicate" });
  });

  it("re-throws non-P2002 errors unchanged", async () => {
    const genericError = new Error("DB connection failed");

    const mockPrisma = {
      user: {
        create: vi.fn().mockRejectedValue(genericError),
      },
    };

    const repo = new PrismaUserRepository(mockPrisma as never);

    const user = User.rehydrate({
      id: "usr_01",
      accountId: "acc_01",
      name: "Alice",
      email: Email.create("alice@example.com"),
      passwordHash: "$argon2id$hashed",
      createdAt: new Date(),
    });

    await expect(repo.create(user)).rejects.toThrow("DB connection failed");
  });

  it("returns User entity after successful creation", async () => {
    const row = makeRow();

    const mockPrisma = {
      user: {
        create: vi.fn().mockResolvedValue(row),
      },
    };

    const repo = new PrismaUserRepository(mockPrisma as never);

    const user = User.rehydrate({
      id: row.id,
      accountId: row.accountId,
      name: row.name,
      email: Email.create(row.email),
      passwordHash: row.passwordHash,
      createdAt: row.createdAt,
    });

    const created = await repo.create(user);
    expect(created.id).toBe(row.id);
    expect(created.email.value).toBe(row.email);
  });
});

describe("PrismaUserRepository — findByEmail", () => {
  it("returns null when user not found", async () => {
    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    const repo = new PrismaUserRepository(mockPrisma as never);
    const result = await repo.findByEmail(Email.create("notfound@example.com"));
    expect(result).toBeNull();
  });

  it("returns User entity when found", async () => {
    const row = makeRow();

    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(row),
      },
    };

    const repo = new PrismaUserRepository(mockPrisma as never);
    const result = await repo.findByEmail(Email.create("alice@example.com"));
    expect(result).not.toBeNull();
    expect(result?.id).toBe(row.id);
  });
});

describe("PrismaUserRepository — countByAccount", () => {
  it("returns 0 when no users belong to the account", async () => {
    const mockPrisma = {
      user: {
        count: vi.fn().mockResolvedValue(0),
      },
    };

    const repo = new PrismaUserRepository(mockPrisma as never);
    const result = await repo.countByAccount("acc_empty");
    expect(result).toBe(0);
    expect(mockPrisma.user.count).toHaveBeenCalledWith({
      where: { accountId: "acc_empty" },
    });
  });

  it("returns 1 when one user belongs to the account", async () => {
    const mockPrisma = {
      user: {
        count: vi.fn().mockResolvedValue(1),
      },
    };

    const repo = new PrismaUserRepository(mockPrisma as never);
    const result = await repo.countByAccount("acc_01");
    expect(result).toBe(1);
    expect(mockPrisma.user.count).toHaveBeenCalledWith({
      where: { accountId: "acc_01" },
    });
  });

  it("returns 2 when two users belong to the account", async () => {
    const mockPrisma = {
      user: {
        count: vi.fn().mockResolvedValue(2),
      },
    };

    const repo = new PrismaUserRepository(mockPrisma as never);
    const result = await repo.countByAccount("acc_01");
    expect(result).toBe(2);
  });

  it("counts are isolated between accounts", async () => {
    const counts: Record<string, number> = {
      acc_A: 2,
      acc_B: 0,
    };

    const mockPrisma = {
      user: {
        count: vi.fn().mockImplementation(({ where }: { where: { accountId: string } }) =>
          Promise.resolve(counts[where.accountId] ?? 0)
        ),
      },
    };

    const repo = new PrismaUserRepository(mockPrisma as never);

    const countA = await repo.countByAccount("acc_A");
    const countB = await repo.countByAccount("acc_B");

    expect(countA).toBe(2);
    expect(countB).toBe(0);
    expect(mockPrisma.user.count).toHaveBeenCalledTimes(2);
    expect(mockPrisma.user.count).toHaveBeenNthCalledWith(1, { where: { accountId: "acc_A" } });
    expect(mockPrisma.user.count).toHaveBeenNthCalledWith(2, { where: { accountId: "acc_B" } });
  });
});

describe("PrismaUserRepository — findById", () => {
  it("returns null when user not found", async () => {
    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    const repo = new PrismaUserRepository(mockPrisma as never);
    const result = await repo.findById("nonexistent");
    expect(result).toBeNull();
  });

  it("returns User entity when found", async () => {
    const row = makeRow();

    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(row),
      },
    };

    const repo = new PrismaUserRepository(mockPrisma as never);
    const result = await repo.findById("usr_01");
    expect(result).not.toBeNull();
    expect(result?.name).toBe(row.name);
  });
});

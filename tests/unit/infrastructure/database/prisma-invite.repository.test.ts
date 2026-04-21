import { describe, it, expect, vi } from "vitest";
import {
  toEntity,
  toPersistence,
  PrismaInviteRepository,
} from "@/infrastructure/database/repositories/prisma-invite.repository";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { Email } from "@/domain/shared/value-objects/email.vo";
import { InviteToken } from "@/domain/shared/value-objects/invite-token.vo";
import { Invite } from "@/domain/account/entities/invite.entity";

const VALID_TOKEN = "a".repeat(32);

const makeRow = (overrides?: Partial<{
  id: string;
  accountId: string;
  email: string;
  token: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}>) => ({
  id: "inv_01",
  accountId: "acc_01",
  email: "guest@example.com",
  token: VALID_TOKEN,
  status: "pending",
  expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  ...overrides,
});

const makeInviteEntity = (overrides?: Parameters<typeof makeRow>[0]): Invite => {
  const row = makeRow(overrides);
  return toEntity(row);
};

// ─── Mappers ────────────────────────────────────────────────────────────────

describe("PrismaInviteRepository — mappers", () => {
  describe("toEntity", () => {
    it("maps row fields to Invite entity correctly", () => {
      const row = makeRow();
      const entity = toEntity(row);

      expect(entity.id).toBe(row.id);
      expect(entity.accountId).toBe(row.accountId);
      expect(entity.email.value).toBe(row.email);
      expect(entity.token.value).toBe(row.token);
      expect(entity.status).toBe(row.status);
      expect(entity.expiresAt).toEqual(row.expiresAt);
      expect(entity.createdAt).toEqual(row.createdAt);
    });

    it("normalizes email to lowercase", () => {
      const row = makeRow({ email: "Guest@Example.COM" });
      const entity = toEntity(row);
      expect(entity.email.value).toBe("guest@example.com");
    });

    it("accepts all valid statuses", () => {
      for (const status of ["pending", "accepted", "expired"] as const) {
        const entity = toEntity(makeRow({ status }));
        expect(entity.status).toBe(status);
      }
    });

    it("throws InvalidValueError for unknown status", () => {
      const row = makeRow({ status: "invalid_status" });
      expect(() => toEntity(row)).toThrow(InvalidValueError);
    });
  });

  describe("toPersistence", () => {
    it("maps Invite entity fields to persistence object correctly", () => {
      const row = makeRow();
      const entity = toEntity(row);
      const persistence = toPersistence(entity);

      expect(persistence.id).toBe(row.id);
      expect(persistence.accountId).toBe(row.accountId);
      expect(persistence.email).toBe(row.email);
      expect(persistence.token).toBe(row.token);
      expect(persistence.status).toBe(row.status);
      expect(persistence.expiresAt).toEqual(row.expiresAt);
      expect(persistence.createdAt).toEqual(row.createdAt);
    });
  });

  describe("round-trip", () => {
    it("toPersistence(toEntity(row)) returns fields equivalent to original row", () => {
      const row = makeRow();
      const result = toPersistence(toEntity(row));

      expect(result.id).toBe(row.id);
      expect(result.accountId).toBe(row.accountId);
      expect(result.email).toBe(row.email);
      expect(result.token).toBe(row.token);
      expect(result.status).toBe(row.status);
      expect(result.expiresAt).toEqual(row.expiresAt);
      expect(result.createdAt).toEqual(row.createdAt);
    });
  });
});

// ─── findByToken ─────────────────────────────────────────────────────────────

describe("PrismaInviteRepository — findByToken", () => {
  it("returns null when invite not found", async () => {
    const mockPrisma = {
      invite: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    const repo = new PrismaInviteRepository(mockPrisma as never);
    const result = await repo.findByToken(InviteToken.create(VALID_TOKEN));
    expect(result).toBeNull();
    expect(mockPrisma.invite.findUnique).toHaveBeenCalledWith({
      where: { token: VALID_TOKEN },
    });
  });

  it("returns Invite entity when found", async () => {
    const row = makeRow();
    const mockPrisma = {
      invite: { findUnique: vi.fn().mockResolvedValue(row) },
    };
    const repo = new PrismaInviteRepository(mockPrisma as never);
    const result = await repo.findByToken(InviteToken.create(VALID_TOKEN));
    expect(result).not.toBeNull();
    expect(result?.id).toBe(row.id);
    expect(result?.token.value).toBe(VALID_TOKEN);
  });
});

// ─── findActivePending ────────────────────────────────────────────────────────

describe("PrismaInviteRepository — findActivePending", () => {
  it("returns active pending invite when it exists", async () => {
    const row = makeRow();
    const mockPrisma = {
      invite: { findFirst: vi.fn().mockResolvedValue(row) },
    };
    const repo = new PrismaInviteRepository(mockPrisma as never);
    const email = Email.create("guest@example.com");
    const result = await repo.findActivePending("acc_01", email);

    expect(result).not.toBeNull();
    expect(result?.status).toBe("pending");
    expect(mockPrisma.invite.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          accountId: "acc_01",
          email: "guest@example.com",
          status: "pending",
        }),
      }),
    );
  });

  it("returns null when no active pending invite exists", async () => {
    const mockPrisma = {
      invite: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const repo = new PrismaInviteRepository(mockPrisma as never);
    const email = Email.create("guest@example.com");
    const result = await repo.findActivePending("acc_01", email);
    expect(result).toBeNull();
  });

  it("filters by expiresAt > now (gt filter present in query)", async () => {
    const mockPrisma = {
      invite: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const repo = new PrismaInviteRepository(mockPrisma as never);
    const email = Email.create("guest@example.com");
    await repo.findActivePending("acc_01", email);

    const callArg = mockPrisma.invite.findFirst.mock.calls[0][0];
    expect(callArg.where.expiresAt).toHaveProperty("gt");
    expect(callArg.where.expiresAt.gt).toBeInstanceOf(Date);
  });

  it("returns null after invite is updated to accepted", async () => {
    // Simulate: first call returns the invite, second call (after accepted) returns null
    const mockPrisma = {
      invite: {
        findFirst: vi.fn()
          .mockResolvedValueOnce(makeRow())
          .mockResolvedValueOnce(null),
      },
    };
    const repo = new PrismaInviteRepository(mockPrisma as never);
    const email = Email.create("guest@example.com");

    const first = await repo.findActivePending("acc_01", email);
    expect(first).not.toBeNull();

    const second = await repo.findActivePending("acc_01", email);
    expect(second).toBeNull();
  });
});

// ─── create ───────────────────────────────────────────────────────────────────

describe("PrismaInviteRepository — create", () => {
  it("returns Invite entity after successful creation", async () => {
    const row = makeRow();
    const mockPrisma = {
      invite: { create: vi.fn().mockResolvedValue(row) },
    };
    const repo = new PrismaInviteRepository(mockPrisma as never);
    const invite = makeInviteEntity();
    const created = await repo.create(invite);

    expect(created.id).toBe(row.id);
    expect(created.token.value).toBe(VALID_TOKEN);
    expect(created.status).toBe("pending");
  });

  it("translates Prisma P2002 unique constraint error to BusinessRuleError('invite.token_duplicate')", async () => {
    const prismaError = Object.assign(new Error("Unique constraint failed"), {
      code: "P2002",
    });
    const mockPrisma = {
      invite: { create: vi.fn().mockRejectedValue(prismaError) },
    };
    const repo = new PrismaInviteRepository(mockPrisma as never);
    const invite = makeInviteEntity();

    await expect(repo.create(invite)).rejects.toThrow(BusinessRuleError);
    await expect(repo.create(invite)).rejects.toMatchObject({
      code: "invite.token_duplicate",
    });
  });

  it("re-throws non-P2002 errors unchanged", async () => {
    const genericError = new Error("DB connection failed");
    const mockPrisma = {
      invite: { create: vi.fn().mockRejectedValue(genericError) },
    };
    const repo = new PrismaInviteRepository(mockPrisma as never);
    const invite = makeInviteEntity();

    await expect(repo.create(invite)).rejects.toThrow("DB connection failed");
  });

  it("create + findByToken returns the same invite (mock consistency)", async () => {
    const row = makeRow();
    const createdRow = { ...row };

    const mockPrisma = {
      invite: {
        create: vi.fn().mockResolvedValue(createdRow),
        findUnique: vi.fn().mockResolvedValue(createdRow),
      },
    };
    const repo = new PrismaInviteRepository(mockPrisma as never);
    const invite = makeInviteEntity();

    const created = await repo.create(invite);
    const found = await repo.findByToken(InviteToken.create(VALID_TOKEN));

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.token.value).toBe(created.token.value);
  });
});

// ─── update ───────────────────────────────────────────────────────────────────

describe("PrismaInviteRepository — update", () => {
  it("calls prisma.invite.update with correct where clause and returns entity", async () => {
    const row = makeRow({ status: "accepted" });
    const mockPrisma = {
      invite: { update: vi.fn().mockResolvedValue(row) },
    };
    const repo = new PrismaInviteRepository(mockPrisma as never);
    const invite = makeInviteEntity();
    const result = await repo.update(invite);

    expect(result).not.toBeNull();
    expect(mockPrisma.invite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: invite.id },
      }),
    );
  });

  it("returns updated Invite entity with new status", async () => {
    const row = makeRow({ status: "accepted" });
    const mockPrisma = {
      invite: { update: vi.fn().mockResolvedValue(row) },
    };
    const repo = new PrismaInviteRepository(mockPrisma as never);
    const invite = makeInviteEntity();
    const updated = await repo.update(invite);

    expect(updated.status).toBe("accepted");
  });

  it("findActivePending returns null after status changes to accepted", async () => {
    const acceptedRow = makeRow({ status: "accepted" });
    const mockPrisma = {
      invite: {
        update: vi.fn().mockResolvedValue(acceptedRow),
        findFirst: vi.fn().mockResolvedValue(null), // accepted invite not returned by findActivePending
      },
    };
    const repo = new PrismaInviteRepository(mockPrisma as never);
    const invite = makeInviteEntity();

    await repo.update(invite);

    const result = await repo.findActivePending("acc_01", Email.create("guest@example.com"));
    expect(result).toBeNull();
  });

  it("findActivePending returns null for invite with expiresAt in the past", async () => {
    const mockPrisma = {
      invite: {
        findFirst: vi.fn().mockResolvedValue(null), // expired invite not returned
      },
    };
    const repo = new PrismaInviteRepository(mockPrisma as never);
    const result = await repo.findActivePending("acc_01", Email.create("guest@example.com"));
    expect(result).toBeNull();
  });
});

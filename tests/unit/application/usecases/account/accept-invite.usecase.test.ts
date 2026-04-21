import { describe, it, expect, beforeEach } from "vitest";
import { AcceptInviteUseCase } from "@/application/usecases/account/accept-invite.usecase";
import { Invite } from "@/domain/account/entities/invite.entity";
import type { InviteRepository } from "@/domain/account/repositories/invite.repository";
import type { UserRepository } from "@/domain/account/repositories/user.repository";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { Email } from "@/domain/shared/value-objects/email.vo";
import { InviteToken } from "@/domain/shared/value-objects/invite-token.vo";
import type { PasswordHasher } from "@/application/ports/password-hasher";
import { User } from "@/domain/account/entities/user.entity";
import type { PrismaClient } from "@prisma/client";

// ─── Fakes ────────────────────────────────────────────────────────────────────

const VALID_TOKEN_STR = "a".repeat(64);
const validToken = InviteToken.create(VALID_TOKEN_STR);
const validEmail = Email.create("invited@example.com");
const ACCOUNT_ID = "acc-1";

function makePendingInvite(): Invite {
  return Invite.rehydrate({
    id: "inv-1",
    accountId: ACCOUNT_ID,
    email: validEmail,
    token: validToken,
    status: "pending",
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    createdAt: new Date(),
  });
}

class FakeInviteRepository implements InviteRepository {
  readonly store: Invite[] = [];

  seed(invite: Invite) {
    this.store.push(invite);
  }

  async findByToken(token: InviteToken): Promise<Invite | null> {
    return this.store.find((i) => i.token.value === token.value) ?? null;
  }

  async findActivePending(): Promise<Invite | null> {
    return null;
  }

  async create(invite: Invite): Promise<Invite> {
    this.store.push(invite);
    return invite;
  }

  async update(invite: Invite): Promise<Invite> {
    const idx = this.store.findIndex((i) => i.id === invite.id);
    if (idx >= 0) this.store[idx] = invite;
    return invite;
  }

  getStored(): Invite[] {
    return this.store;
  }
}

class FakeUserRepository implements UserRepository {
  readonly store: User[] = [];

  setCount(count: number) {
    this.store.length = 0;
    for (let i = 0; i < count; i++) {
      this.store.push({ id: `user-fake-${i}`, accountId: ACCOUNT_ID } as unknown as User);
    }
  }

  async findByEmail(): Promise<User | null> {
    return null;
  }

  async findById(): Promise<User | null> {
    return null;
  }

  async create(user: User): Promise<User> {
    this.store.push(user);
    return user;
  }

  async countByAccount(): Promise<number> {
    return this.store.length;
  }

  getStored(): User[] {
    return this.store;
  }
}

class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed(${plain})`;
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    return hash === `hashed(${plain})`;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFakePrisma(inviteRepo: FakeInviteRepository, userRepo: FakeUserRepository): PrismaClient {
  return {
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        user: {
          create: async ({ data }: { data: { id: string; accountId: string; name: string; email: string; passwordHash: string; createdAt: Date } }) => {
            userRepo.store.push(User.rehydrate({ id: data.id, accountId: data.accountId, name: data.name, email: Email.create(data.email), passwordHash: data.passwordHash, createdAt: data.createdAt }));
            return data;
          },
        },
        invite: {
          update: async ({ where, data }: { where: { id: string }; data: { status: string } }) => {
            const invite = inviteRepo.store.find((i) => i.id === where.id);
            if (invite) Object.assign(invite, { _status: data.status });
            return {};
          },
        },
      };
      return fn(tx);
    },
  } as unknown as PrismaClient;
}

function buildSut(opts?: {
  invite?: Invite | null;
  userCount?: number;
}) {
  const inviteRepo = new FakeInviteRepository();
  const userRepo = new FakeUserRepository();
  const hasher = new FakePasswordHasher();

  if (opts?.invite !== null) {
    inviteRepo.seed(opts?.invite ?? makePendingInvite());
  }
  if (opts?.userCount !== undefined) {
    userRepo.setCount(opts.userCount);
  }

  const sut = new AcceptInviteUseCase(inviteRepo, userRepo, hasher, buildFakePrisma(inviteRepo, userRepo));
  return { sut, inviteRepo, userRepo };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AcceptInviteUseCase", () => {
  describe("when token is not found", () => {
    it("throws BusinessRuleError with code 'invite.not_found'", async () => {
      const { sut } = buildSut({ invite: null });

      await expect(
        sut.execute({ token: VALID_TOKEN_STR, name: "Bob", password: "password123" }),
      ).rejects.toSatisfy((e: unknown) => {
        return e instanceof BusinessRuleError && e.code === "invite.not_found";
      });
    });
  });

  describe("when invite is already accepted", () => {
    it("throws BusinessRuleError with code 'invite.expired_or_used'", async () => {
      const acceptedInvite = Invite.rehydrate({
        id: "inv-acc",
        accountId: ACCOUNT_ID,
        email: validEmail,
        token: validToken,
        status: "accepted",
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        createdAt: new Date(),
      });
      const { sut } = buildSut({ invite: acceptedInvite });

      await expect(
        sut.execute({ token: VALID_TOKEN_STR, name: "Bob", password: "password123" }),
      ).rejects.toSatisfy((e: unknown) => {
        return e instanceof BusinessRuleError && e.code === "invite.expired_or_used";
      });
    });
  });

  describe("when invite is expired (past expiresAt)", () => {
    it("throws BusinessRuleError with code 'invite.expired_or_used'", async () => {
      const expiredInvite = Invite.rehydrate({
        id: "inv-exp",
        accountId: ACCOUNT_ID,
        email: validEmail,
        token: validToken,
        status: "pending",
        expiresAt: new Date(Date.now() - 1000),
        createdAt: new Date(Date.now() - 49 * 60 * 60 * 1000),
      });
      const { sut } = buildSut({ invite: expiredInvite });

      await expect(
        sut.execute({ token: VALID_TOKEN_STR, name: "Bob", password: "password123" }),
      ).rejects.toSatisfy((e: unknown) => {
        return e instanceof BusinessRuleError && e.code === "invite.expired_or_used";
      });
    });
  });

  describe("when invite status is 'expired'", () => {
    it("throws BusinessRuleError with code 'invite.expired_or_used'", async () => {
      const expiredStatusInvite = Invite.rehydrate({
        id: "inv-exp-status",
        accountId: ACCOUNT_ID,
        email: validEmail,
        token: validToken,
        status: "expired",
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        createdAt: new Date(),
      });
      const { sut } = buildSut({ invite: expiredStatusInvite });

      await expect(
        sut.execute({ token: VALID_TOKEN_STR, name: "Bob", password: "password123" }),
      ).rejects.toSatisfy((e: unknown) => {
        return e instanceof BusinessRuleError && e.code === "invite.expired_or_used";
      });
    });
  });

  describe("when password is too short", () => {
    it("throws InvalidValueError for password", async () => {
      const { sut } = buildSut();

      await expect(
        sut.execute({ token: VALID_TOKEN_STR, name: "Bob", password: "short" }),
      ).rejects.toBeInstanceOf(InvalidValueError);
    });

    it("throws InvalidValueError with field 'password'", async () => {
      const { sut } = buildSut();

      await expect(
        sut.execute({ token: VALID_TOKEN_STR, name: "Bob", password: "1234567" }),
      ).rejects.toSatisfy((e: unknown) => {
        return e instanceof InvalidValueError && e.field === "password";
      });
    });

    it("accepts password exactly at minimum length (8 chars)", async () => {
      const { sut } = buildSut({ userCount: 0 });

      await expect(
        sut.execute({ token: VALID_TOKEN_STR, name: "Bob", password: "12345678" }),
      ).resolves.toBeDefined();
    });
  });

  describe("when account is full (>= 2 users)", () => {
    it("throws BusinessRuleError with code 'invite.account_full'", async () => {
      const { sut } = buildSut({ userCount: 2 });

      await expect(
        sut.execute({ token: VALID_TOKEN_STR, name: "Bob", password: "password123" }),
      ).rejects.toSatisfy((e: unknown) => {
        return e instanceof BusinessRuleError && e.code === "invite.account_full";
      });
    });
  });

  describe("when all inputs are valid", () => {
    it("returns userId and accountId", async () => {
      const { sut } = buildSut();
      const result = await sut.execute({ token: VALID_TOKEN_STR, name: "Bob", password: "password123" });
      expect(result).toMatchObject({ accountId: ACCOUNT_ID });
      expect(typeof result.userId).toBe("string");
      expect(result.userId.length).toBeGreaterThan(0);
    });

    it("creates a new user in the user repository", async () => {
      const { sut, userRepo } = buildSut();
      await sut.execute({ token: VALID_TOKEN_STR, name: "Bob", password: "password123" });
      const stored = userRepo.getStored();
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe("Bob");
      expect(stored[0].accountId).toBe(ACCOUNT_ID);
    });

    it("marks the invite as accepted via prisma transaction", async () => {
      const { sut, inviteRepo } = buildSut();
      await sut.execute({ token: VALID_TOKEN_STR, name: "Bob", password: "password123" });
      // The invite status is updated via raw prisma; the fake tx sets _status
      const stored = inviteRepo.getStored();
      expect((stored[0] as unknown as { _status: string })._status).toBe("accepted");
    });

    it("creates user with the email from the invite", async () => {
      const { sut, userRepo } = buildSut();
      await sut.execute({ token: VALID_TOKEN_STR, name: "Bob", password: "password123" });
      const stored = userRepo.getStored();
      expect(stored[0].email.value).toBe("invited@example.com");
    });
  });
});

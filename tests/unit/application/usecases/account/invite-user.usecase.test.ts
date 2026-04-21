import { describe, it, expect, beforeEach } from "vitest";
import { InviteUserUseCase } from "@/application/usecases/account/invite-user.usecase";
import { Account } from "@/domain/account/entities/account.entity";
import { Invite } from "@/domain/account/entities/invite.entity";
import type { AccountRepository } from "@/domain/account/repositories/account.repository";
import type { InviteRepository } from "@/domain/account/repositories/invite.repository";
import type { UserRepository } from "@/domain/account/repositories/user.repository";
import { Email } from "@/domain/shared/value-objects/email.vo";
import { InviteToken } from "@/domain/shared/value-objects/invite-token.vo";
import type { Mailer } from "@/application/ports/mailer";
import type { TokenGenerator } from "@/application/ports/token-generator";
import type { User } from "@/domain/account/entities/user.entity";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCOUNT_ID = "acc-1";
const INVITER_USER_ID = "user-1";
const INVITEE_EMAIL = "invitee@example.com";
const BASE_URL = "https://app.example.com";
const FAKE_TOKEN = "f".repeat(64);

// ─── Fakes ────────────────────────────────────────────────────────────────────

class FakeUserRepository implements UserRepository {
  private users: User[] = [];
  private countMap: Map<string, number> = new Map();

  seed(user: User) { this.users.push(user); }
  setCount(accountId: string, count: number) { this.countMap.set(accountId, count); }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async findByEmail(email: Email): Promise<User | null> {
    return this.users.find((u) => u.email.value === email.value) ?? null;
  }
  async countByAccount(accountId: string): Promise<number> {
    return this.countMap.get(accountId) ?? 0;
  }
  async create(user: User): Promise<User> { this.users.push(user); return user; }
}

class FakeAccountRepository implements AccountRepository {
  private accounts: Account[] = [];

  seed(account: Account) { this.accounts.push(account); }

  async findById(id: string): Promise<Account | null> {
    return this.accounts.find((a) => a.id === id) ?? null;
  }
  async create(account: Account): Promise<Account> { this.accounts.push(account); return account; }
}

class FakeInviteRepository implements InviteRepository {
  private store: Invite[] = [];
  activePendingResult: Invite | null = null;
  created: Invite[] = [];

  async findByToken(): Promise<Invite | null> { return null; }
  async findActivePending(): Promise<Invite | null> { return this.activePendingResult; }
  async create(invite: Invite): Promise<Invite> { this.created.push(invite); this.store.push(invite); return invite; }
  async update(invite: Invite): Promise<Invite> { return invite; }
}

class FakeTokenGenerator implements TokenGenerator {
  generate() { return FAKE_TOKEN; }
}

class FakeMailer implements Mailer {
  calls: Parameters<Mailer["sendInvite"]>[0][] = [];
  async sendInvite(payload: Parameters<Mailer["sendInvite"]>[0]) { this.calls.push(payload); }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("InviteUserUseCase", () => {
  let users: FakeUserRepository;
  let accounts: FakeAccountRepository;
  let invites: FakeInviteRepository;
  let mailer: FakeMailer;
  let tokenGen: FakeTokenGenerator;
  let useCase: InviteUserUseCase;
  let inviterUser: User;

  beforeEach(() => {
    users = new FakeUserRepository();
    accounts = new FakeAccountRepository();
    invites = new FakeInviteRepository();
    mailer = new FakeMailer();
    tokenGen = new FakeTokenGenerator();
    useCase = new InviteUserUseCase(users, accounts, invites, mailer, tokenGen, BASE_URL);

    const account = Account.create({ id: ACCOUNT_ID, name: "Minha Conta" });
    accounts.seed(account);

    inviterUser = { id: INVITER_USER_ID, accountId: ACCOUNT_ID, name: "João", email: Email.create("joao@example.com") } as User;
    users.seed(inviterUser);
    users.setCount(ACCOUNT_ID, 1);
  });

  describe("happy path", () => {
    it("returns inviteId and calls mailer with correct acceptUrl", async () => {
      const result = await useCase.execute({ accountId: ACCOUNT_ID, inviterUserId: INVITER_USER_ID, email: INVITEE_EMAIL });

      expect(result.inviteId).toBeTruthy();
      expect(invites.created).toHaveLength(1);
      expect(mailer.calls).toHaveLength(1);
      expect(mailer.calls[0].acceptUrl).toBe(`${BASE_URL}/convite/${FAKE_TOKEN}`);
    });

    it("uses inviter name in mailer payload", async () => {
      await useCase.execute({ accountId: ACCOUNT_ID, inviterUserId: INVITER_USER_ID, email: INVITEE_EMAIL });
      expect(mailer.calls[0].inviterName).toBe("João");
    });

    it("uses account name in mailer payload", async () => {
      await useCase.execute({ accountId: ACCOUNT_ID, inviterUserId: INVITER_USER_ID, email: INVITEE_EMAIL });
      expect(mailer.calls[0].accountName).toBe("Minha Conta");
    });
  });

  describe("error: account full", () => {
    it("throws BusinessRuleError('invite.account_full') when count >= 2", async () => {
      users.setCount(ACCOUNT_ID, 2);
      await expect(useCase.execute({ accountId: ACCOUNT_ID, inviterUserId: INVITER_USER_ID, email: INVITEE_EMAIL }))
        .rejects.toMatchObject({ code: "invite.account_full" });
      expect(mailer.calls).toHaveLength(0);
    });
  });

  describe("error: already member", () => {
    it("throws BusinessRuleError('invite.already_member') when email belongs to same account", async () => {
      const member = { id: "user-2", accountId: ACCOUNT_ID, name: "Maria", email: Email.create(INVITEE_EMAIL) } as User;
      users.seed(member);
      await expect(useCase.execute({ accountId: ACCOUNT_ID, inviterUserId: INVITER_USER_ID, email: INVITEE_EMAIL }))
        .rejects.toMatchObject({ code: "invite.already_member" });
      expect(mailer.calls).toHaveLength(0);
    });
  });

  describe("error: email in use by another account", () => {
    it("throws BusinessRuleError('invite.email_in_use') when email belongs to different account", async () => {
      const other = { id: "user-3", accountId: "other-acc", name: "Pedro", email: Email.create(INVITEE_EMAIL) } as User;
      users.seed(other);
      await expect(useCase.execute({ accountId: ACCOUNT_ID, inviterUserId: INVITER_USER_ID, email: INVITEE_EMAIL }))
        .rejects.toMatchObject({ code: "invite.email_in_use" });
      expect(mailer.calls).toHaveLength(0);
    });
  });

  describe("error: already pending invite", () => {
    it("throws BusinessRuleError('invite.already_pending') when active pending invite exists", async () => {
      invites.activePendingResult = Invite.rehydrate({
        id: "inv-old", accountId: ACCOUNT_ID, email: Email.create(INVITEE_EMAIL),
        token: InviteToken.create("a".repeat(64)), status: "pending",
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000), createdAt: new Date(),
      });
      await expect(useCase.execute({ accountId: ACCOUNT_ID, inviterUserId: INVITER_USER_ID, email: INVITEE_EMAIL }))
        .rejects.toMatchObject({ code: "invite.already_pending" });
      expect(mailer.calls).toHaveLength(0);
    });
  });

  describe("error: account not found", () => {
    it("throws BusinessRuleError('account.not_found') for unknown accountId", async () => {
      await expect(useCase.execute({ accountId: "unknown", inviterUserId: INVITER_USER_ID, email: INVITEE_EMAIL }))
        .rejects.toMatchObject({ code: "account.not_found" });
      expect(mailer.calls).toHaveLength(0);
    });
  });
});

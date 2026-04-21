import { describe, it, expect, beforeEach } from "vitest";
import { RegisterAccountUseCase } from "@/application/usecases/account/register-account.usecase";
import type { AccountRepository } from "@/domain/account/repositories/account.repository";
import type { UserRepository } from "@/domain/account/repositories/user.repository";
import type { Account } from "@/domain/account/entities/account.entity";
import type { User } from "@/domain/account/entities/user.entity";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import type { Email } from "@/domain/shared/value-objects/email.vo";
import type { PasswordHasher } from "@/infrastructure/auth/password-hasher";
import type { PrismaClient } from "@prisma/client";

// ---------------------------------------------------------------------------
// Fakes em memória
// ---------------------------------------------------------------------------

class FakeAccountRepository implements AccountRepository {
  readonly store: Account[] = [];

  async findById(id: string): Promise<Account | null> {
    return this.store.find((a) => a.id === id) ?? null;
  }

  async create(account: Account): Promise<Account> {
    this.store.push(account);
    return account;
  }
}

class FakeUserRepository implements UserRepository {
  readonly store: User[] = [];

  async findByEmail(email: Email): Promise<User | null> {
    return this.store.find((u) => u.email.value === email.value) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.store.find((u) => u.id === id) ?? null;
  }

  async create(user: User): Promise<User> {
    this.store.push(user);
    return user;
  }

  async countByAccount(accountId: string): Promise<number> {
    return this.store.filter((u) => u.accountId === accountId).length;
  }
}

class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}

// PrismaClient stub — não é usado no MVP (débito técnico de transação)
const fakePrisma = {} as PrismaClient;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUseCase(users?: UserRepository, accounts?: AccountRepository) {
  return new RegisterAccountUseCase(
    users ?? new FakeUserRepository(),
    accounts ?? new FakeAccountRepository(),
    new FakePasswordHasher(),
    fakePrisma,
  );
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("RegisterAccountUseCase", () => {
  let userRepo: FakeUserRepository;
  let accountRepo: FakeAccountRepository;
  let useCase: RegisterAccountUseCase;

  beforeEach(() => {
    userRepo = new FakeUserRepository();
    accountRepo = new FakeAccountRepository();
    useCase = new RegisterAccountUseCase(userRepo, accountRepo, new FakePasswordHasher(), fakePrisma);
  });

  describe("sucesso", () => {
    it("retorna userId e accountId não vazios", async () => {
      const result = await useCase.execute({
        name: "João Silva",
        email: "joao@example.com",
        password: "senhaSegura1",
      });

      expect(result.userId).toBeTruthy();
      expect(result.accountId).toBeTruthy();
    });

    it("persiste o usuário no repositório", async () => {
      await useCase.execute({
        name: "Maria Souza",
        email: "maria@example.com",
        password: "senha1234",
      });

      const emailVO = { value: "maria@example.com" } as Email;
      const found = await userRepo.findByEmail(emailVO);
      expect(found).not.toBeNull();
      expect(found?.name).toBe("Maria Souza");
    });

    it("persiste a conta no repositório", async () => {
      const result = await useCase.execute({
        name: "Carlos Costa",
        email: "carlos@example.com",
        password: "senha5678",
      });

      const account = await accountRepo.findById(result.accountId);
      expect(account).not.toBeNull();
      expect(account?.name).toBe("Carlos Costa");
    });

    it("armazena o hash da senha (não texto plano)", async () => {
      await useCase.execute({
        name: "Ana Lima",
        email: "ana@example.com",
        password: "minhasenha",
      });

      const emailVO = { value: "ana@example.com" } as Email;
      const user = await userRepo.findByEmail(emailVO);
      expect(user?.passwordHash).toBe("hashed:minhasenha");
      expect(user?.passwordHash).not.toBe("minhasenha");
    });

    it("userId e accountId são UUID v4 (formato correto)", async () => {
      const result = await useCase.execute({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(result.userId).toMatch(uuidRegex);
      expect(result.accountId).toMatch(uuidRegex);
    });

    it("userId e accountId são diferentes entre si", async () => {
      const result = await useCase.execute({
        name: "Test User",
        email: "unique@example.com",
        password: "password123",
      });

      expect(result.userId).not.toBe(result.accountId);
    });

    it("dois registros geram ids distintos", async () => {
      const r1 = await useCase.execute({
        name: "User One",
        email: "user1@example.com",
        password: "password123",
      });
      const r2 = await makeUseCase().execute({
        name: "User Two",
        email: "user2@example.com",
        password: "password456",
      });

      expect(r1.userId).not.toBe(r2.userId);
      expect(r1.accountId).not.toBe(r2.accountId);
    });
  });

  describe("erro: email duplicado", () => {
    it("lança BusinessRuleError com code email.duplicate quando e-mail já existe", async () => {
      await useCase.execute({
        name: "Primeiro",
        email: "duplicado@example.com",
        password: "senha1234",
      });

      await expect(
        useCase.execute({
          name: "Segundo",
          email: "duplicado@example.com",
          password: "outrasenha",
        }),
      ).rejects.toThrow(BusinessRuleError);
    });

    it("o código do erro é email.duplicate", async () => {
      await useCase.execute({
        name: "Primeiro",
        email: "dup@example.com",
        password: "senha1234",
      });

      let err: BusinessRuleError | undefined;
      try {
        await useCase.execute({ name: "Segundo", email: "dup@example.com", password: "outrasenha" });
      } catch (e) {
        err = e as BusinessRuleError;
      }

      expect(err?.code).toBe("email.duplicate");
    });

    it("e-mail duplicado é case-insensitive (normalizado pelo VO Email)", async () => {
      await useCase.execute({
        name: "Primeiro",
        email: "test@example.com",
        password: "senha1234",
      });

      await expect(
        useCase.execute({
          name: "Segundo",
          email: "TEST@EXAMPLE.COM",
          password: "outrasenha",
        }),
      ).rejects.toThrow(BusinessRuleError);
    });
  });

  describe("erro: senha curta", () => {
    it("lança InvalidValueError quando senha tem menos de 8 caracteres", async () => {
      await expect(
        useCase.execute({
          name: "João",
          email: "joao2@example.com",
          password: "1234567",
        }),
      ).rejects.toThrow(InvalidValueError);
    });

    it("o campo do erro é password", async () => {
      let err: InvalidValueError | undefined;
      try {
        await useCase.execute({ name: "João", email: "joao3@example.com", password: "short" });
      } catch (e) {
        err = e as InvalidValueError;
      }

      expect(err?.field).toBe("password");
    });

    it("senha com exatamente 8 caracteres é aceita", async () => {
      await expect(
        useCase.execute({
          name: "João",
          email: "joao4@example.com",
          password: "12345678",
        }),
      ).resolves.toBeDefined();
    });

    it("não persiste nada quando senha é inválida", async () => {
      try {
        await useCase.execute({ name: "João", email: "joao5@example.com", password: "curta" });
      } catch {
        // esperado
      }

      expect(userRepo.store).toHaveLength(0);
      expect(accountRepo.store).toHaveLength(0);
    });
  });

  describe("erro: email inválido", () => {
    it("lança InvalidValueError para e-mail malformado", async () => {
      await expect(
        useCase.execute({
          name: "Test",
          email: "nao-e-email",
          password: "senha1234",
        }),
      ).rejects.toThrow(InvalidValueError);
    });
  });
});

---
status: completed
parallelizable: false
blocked_by: ["8.0", "9.0"]
---

<task_context>
<domain>infra/auth</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>http_server</dependencies>
</task_context>

# Tarefa 10.0: Infra auth — Argon2PasswordHasher, nextauth.config e container

## Visão Geral

Conectar as peças de auth: implementar o `PasswordHasher` com argon2id, criar o `authOptions` do NextAuth com Credentials Provider funcional, montar o container de DI (função factory) e atualizar o route handler existente.

<requirements>
- `PasswordHasher` interface + `Argon2PasswordHasher` usando argon2id com params OWASP
- `nextauth.config.ts` exportando `authOptions` com Credentials Provider
- `authorize()` usa `UserRepository.findByEmail` + `PasswordHasher.verify`
- Retorno genérico `null` para falhas (sem distinguir user-não-existe de senha-errada)
- Session callback injeta `accountId` no token/session
- Container (`src/infrastructure/container.ts`) exporta singletons de `userRepository`, `hasher`, `mailer`
- Route handler `app/api/auth/[...nextauth]/route.ts` usa `authOptions` e força `runtime = "nodejs"`
- Testes para `Argon2PasswordHasher` (hash/verify round-trip, senha errada, hash ≠ plain)
</requirements>

## Subtarefas

- [x] 10.1 Criar `src/infrastructure/auth/password-hasher.ts` (interface + `Argon2PasswordHasher`)
- [x] 10.2 Criar teste `tests/unit/infrastructure/auth/password-hasher.test.ts`
- [x] 10.3 Criar `src/infrastructure/container.ts` com singletons
- [x] 10.4 Criar `src/infrastructure/auth/nextauth.config.ts` com `authOptions`
- [x] 10.5 Atualizar `src/app/api/auth/[...nextauth]/route.ts` para importar `authOptions` e forçar `export const runtime = "nodejs"`
- [x] 10.6 Rodar `npm test`, `npm run lint` e `npm run build`

## Detalhes de Implementação

```ts
// password-hasher.ts
import argon2 from "argon2";
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
}
export class Argon2PasswordHasher implements PasswordHasher {
  async hash(plain: string) {
    return argon2.hash(plain, { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 });
  }
  async verify(hash: string, plain: string) {
    try { return await argon2.verify(hash, plain); } catch { return false; }
  }
}
```

```ts
// container.ts
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma.client";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/prisma-user.repository";
import { PrismaAccountRepository } from "@/infrastructure/database/repositories/prisma-account.repository";
import { Argon2PasswordHasher } from "@/infrastructure/auth/password-hasher";
import { NoopMailer } from "@/infrastructure/mailer/noop.mailer";

export const userRepository = new PrismaUserRepository(prisma);
export const accountRepository = new PrismaAccountRepository(prisma);
export const hasher = new Argon2PasswordHasher();
export const mailer = new NoopMailer();
```

```ts
// nextauth.config.ts (trecho)
export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  providers: [CredentialsProvider({
    name: "Credentials",
    credentials: { email: {}, password: {} },
    async authorize(creds) {
      try {
        const email = Email.create(creds?.email ?? "");
        const user = await userRepository.findByEmail(email);
        if (!user) return null;
        const ok = await hasher.verify(user.passwordHash, creds!.password ?? "");
        return ok ? { id: user.id, email: user.email.value, accountId: user.accountId } : null;
      } catch { return null; }
    },
  })],
  callbacks: {
    async jwt({ token, user }) { if (user) (token as any).accountId = (user as any).accountId; return token; },
    async session({ session, token }) { (session as any).accountId = (token as any).accountId; return session; },
  },
  pages: { signIn: "/login" },
};
```

Route handler:
```ts
export const runtime = "nodejs";
import NextAuth from "next-auth";
import { authOptions } from "@/infrastructure/auth/nextauth.config";
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

## Critérios de Sucesso

- `hasher.hash("x").then(h => hasher.verify(h, "x"))` → `true`
- `hasher.verify(h, "wrong")` → `false`
- Hash gerado não contém a string em claro
- `npm run build` passa (NextAuth sem erros de tipo)
- `GET /api/auth/session` retorna JSON válido sem 500
- `npm run lint` passa — `application/` não importa de `infrastructure/`; `infrastructure/auth` pode importar de `infrastructure/database`

---
status: completed
parallelizable: false
blocked_by: ["10.0"]
---

<task_context>
<domain>docs</domain>
<type>testing</type>
<scope>configuration</scope>
<complexity>low</complexity>
<dependencies>database|http_server</dependencies>
</task_context>

# Tarefa 11.0: Validação manual — seed script e login funcional

## Visão Geral

Validar a Fase 1 ponta-a-ponta: criar um script de seed que insere uma `Account` + `User` com senha argon2 hasheada e autenticar via `POST /api/auth/callback/credentials` confirmando que a sessão é emitida com `accountId`. Documentar os passos no README para futuras fases.

<requirements>
- Script `scripts/seed-dev.ts` que cria Account + User de teste com senha hasheada via `Argon2PasswordHasher`
- Script é idempotente (upsert por email)
- Documentação mínima em `README.md` (ou `docs/dev.md`) com passos de validação
- Todos os critérios da seção "Validação Manual" do TechSpec verificados
- Lint de boundaries ativo como `error` (promover de `warn` se estava em warn)
</requirements>

## Subtarefas

- [x] 11.1 Criar `scripts/seed-dev.ts` usando `tsx` (ou `ts-node`) com email/senha configuráveis via env
- [x] 11.2 Adicionar script `"seed:dev": "tsx scripts/seed-dev.ts"` no `package.json` (instalar `tsx` como dev dep se necessário)
- [x] 11.3 Executar `npm run seed:dev` e confirmar criação no banco (`sqlite3 prisma/dev.db "SELECT * FROM User"`)
- [x] 11.4 Subir `npm run dev`, chamar `POST /api/auth/callback/credentials` com curl/httpie e validar cookie de sessão
- [x] 11.5 `GET /api/auth/session` retorna `{ user: {...}, accountId: "..." }`
- [x] 11.6 Promover regra `boundaries/element-types` de `warn` para `error` se estava em warn; verificar que adicionar `import "@/infrastructure/x"` em `src/domain/` dispara erro
- [x] 11.7 Documentar no README os comandos de seed + login
- [x] 11.8 Rodar `npm test`, `npm run lint`, `npm run build` — todos verdes

## Detalhes de Implementação

`scripts/seed-dev.ts` esqueleto:
```ts
import { prisma } from "@/infrastructure/database/prisma.client";
import { Argon2PasswordHasher } from "@/infrastructure/auth/password-hasher";

const email = process.env.SEED_EMAIL ?? "dev@rodagem.app";
const password = process.env.SEED_PASSWORD ?? "dev123456";

async function main() {
  const hasher = new Argon2PasswordHasher();
  const hash = await hasher.hash(password);
  const account = await prisma.account.upsert({
    where: { id: "seed-account" },
    update: {}, create: { id: "seed-account", name: "Dev Account" },
  });
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash },
    create: { accountId: account.id, name: "Dev User", email, passwordHash: hash },
  });
  console.log(`seeded: ${email} / ${password}`);
}
main().finally(() => prisma.$disconnect());
```

Validação manual:
```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=dev@rodagem.app&password=dev123456&csrfToken=..."
curl -b cookies.txt http://localhost:3000/api/auth/session
```

## Critérios de Sucesso

- `npm run seed:dev` cria o usuário sem erro e é idempotente (rodar 2x não quebra)
- Login via credentials retorna cookie `next-auth.session-token`
- `GET /api/auth/session` retorna objeto com `accountId` populado
- `npm run lint` falha se um arquivo de `src/domain/` importar de `src/infrastructure/`
- `npm test`, `npm run lint` e `npm run build` passam
- README atualizado com os novos comandos

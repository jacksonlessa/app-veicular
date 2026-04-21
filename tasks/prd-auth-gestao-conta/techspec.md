# TechSpec — Auth e Gestão de Conta

**Slug:** `auth-gestao-conta`
**PRD:** `tasks/prd-auth-gestao-conta/prd.md`
**Data:** 2026-04-20

---

## Resumo Executivo

A Fase 2 entrega os fluxos de **registro, login, auth guard e convite de usuário** sobre a infraestrutura já estabelecida na Fase 1 (Prisma, NextAuth credentials, Argon2PasswordHasher, Mailer port, VOs `Email`/`InviteToken`, entidades `Account`/`User`).

A implementação adiciona três use cases em `application/` (`register-account`, `invite-user`, `accept-invite`), a entidade de domínio `Invite` com repositório, quatro rotas REST em `src/app/api/`, três páginas server-rendered (`/cadastro`, `/login`, `/convite/[token]`) e um **auth guard** via middleware do Next.js combinado ao `route group` `(app)/`. Não há novas dependências: todo o stack necessário já está instalado (`next-auth@4`, `argon2`, `@prisma/client`, Prisma schema com os modelos `Account`/`User`/`Invite`).

A decisão arquitetural dominante é manter **todas as regras de negócio em `application/` e `domain/`** (inclusive o limite de 2 usuários/conta e o ciclo de vida do token de convite), deixando as route handlers do App Router como camada fina de transporte (validação de input → chamada do use case → mapeamento de erro para HTTP).

---

## Arquitetura do Sistema

### Visão Geral dos Componentes

```
src/
├── domain/
│   └── account/
│       ├── entities/
│       │   ├── invite.entity.ts            ← NOVO (Invite + InviteStatus)
│       │   └── (account.entity.ts, user.entity.ts já existem)
│       └── repositories/
│           ├── invite.repository.ts         ← NOVO
│           └── (account/user repos estendidos)
├── application/
│   ├── ports/ (mailer.ts já existe)
│   └── usecases/
│       └── account/
│           ├── register-account.usecase.ts  ← NOVO
│           ├── invite-user.usecase.ts       ← NOVO
│           └── accept-invite.usecase.ts     ← NOVO
├── infrastructure/
│   ├── auth/
│   │   ├── nextauth.config.ts (já existe)
│   │   └── token-generator.ts               ← NOVO (crypto.randomBytes → hex)
│   ├── database/
│   │   └── repositories/
│   │       └── prisma-invite.repository.ts  ← NOVO
│   └── container.ts                         ← ATUALIZADO (registra novos)
├── app/
│   ├── (auth)/                              ← NOVO route group (público)
│   │   ├── login/page.tsx
│   │   ├── cadastro/page.tsx
│   │   └── convite/[token]/page.tsx
│   ├── (app)/                               ← NOVO route group (protegido)
│   │   └── layout.tsx                       ← auth guard server-side
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts (já existe)
│   │   ├── auth/register/route.ts           ← NOVO
│   │   └── invites/
│   │       ├── route.ts                     ← NOVO (POST criar)
│   │       └── [token]/route.ts             ← NOVO (GET validar, POST aceitar)
│   └── middleware.ts                        ← NOVO (redireciona rotas protegidas)
└── components/
    └── auth/                                ← NOVO
        ├── LoginForm.tsx
        ├── RegisterForm.tsx
        └── AcceptInviteForm.tsx
```

**Fluxo de dados (convite):**

1. Usuário logado submete `POST /api/invites` com `{ email }`.
2. Route handler extrai `accountId` da sessão NextAuth e chama `InviteUserUseCase`.
3. Use case: busca conta → valida limite (≤ 2 users) → gera token → persiste `Invite` → chama `Mailer.sendInvite`.
4. Mailer (em dev, `NoopMailer`) loga o link; em prod, um adapter SMTP/Resend (fora do escopo dessa fase) enviará o e-mail.
5. Convidado abre `/convite/[token]` → página chama `GET /api/invites/[token]` (server component) para validar → renderiza form → `POST /api/invites/[token]` chama `AcceptInviteUseCase`.

---

## Design de Implementação

### Interfaces Principais

**Entidade `Invite`** (`domain/account/entities/invite.entity.ts`):

```ts
export type InviteStatus = "pending" | "accepted" | "expired";

export interface InviteProps {
  id: string;
  accountId: string;
  email: Email;
  token: InviteToken;
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
}

export class Invite {
  static create(input: { id; accountId; email; token; ttlHours: number }): Invite;
  static rehydrate(props: InviteProps): Invite;
  isExpired(now: Date): boolean;
  markAccepted(): void;           // muda status in-place
  isUsable(now: Date): boolean;   // pending && !expired
  // getters: id, accountId, email, token, status, expiresAt, createdAt
}
```

**Repositório** (`domain/account/repositories/invite.repository.ts`):

```ts
export interface InviteRepository {
  findByToken(token: InviteToken): Promise<Invite | null>;
  create(invite: Invite): Promise<Invite>;
  update(invite: Invite): Promise<Invite>;       // para marcar accepted
  findActivePending(accountId: string, email: Email): Promise<Invite | null>;
}
```

**Extensão em `UserRepository`:**

```ts
countByAccount(accountId: string): Promise<number>;
```

**Use cases:**

```ts
// application/usecases/account/register-account.usecase.ts
export class RegisterAccountUseCase {
  constructor(deps: {
    users: UserRepository;
    accounts: AccountRepository;
    hasher: PasswordHasher;
    prisma: PrismaClient;           // para transação atômica Account+User
  });
  execute(input: { name: string; email: string; password: string }):
    Promise<{ userId: string; accountId: string }>;
}

// application/usecases/account/invite-user.usecase.ts
export class InviteUserUseCase {
  constructor(deps: {
    users: UserRepository;
    invites: InviteRepository;
    accounts: AccountRepository;
    mailer: Mailer;
    tokenGenerator: TokenGenerator;
    inviter: { baseUrl: string };
  });
  execute(input: {
    accountId: string; inviterUserId: string; email: string;
  }): Promise<{ inviteId: string }>;
}

// application/usecases/account/accept-invite.usecase.ts
export class AcceptInviteUseCase {
  constructor(deps: {
    invites: InviteRepository;
    users: UserRepository;
    hasher: PasswordHasher;
    prisma: PrismaClient;
  });
  execute(input: { token: string; name: string; password: string }):
    Promise<{ userId: string; accountId: string }>;
}
```

**Port `TokenGenerator`** (`application/ports/token-generator.ts`):

```ts
export interface TokenGenerator { generate(): string; }   // 32 bytes hex
```

Impl em `infrastructure/auth/token-generator.ts` usando `crypto.randomBytes(32).toString("hex")`.

### Regras de Negócio (use cases)

**RegisterAccountUseCase:**

1. `Email.create(email)` (valida formato).
2. Valida senha: mínimo 8 caracteres (constante `MIN_PASSWORD_LEN = 8`).
3. `userRepository.findByEmail` → se existir, lança `BusinessRuleError("email.duplicate")`.
4. `prisma.$transaction`: cria `Account` (`name = "Conta de " + userName` ou o próprio nome) e `User` vinculado.
5. Retorna ids. O caller (API route) aciona o `signIn()` do NextAuth em seguida.

**InviteUserUseCase:**

1. `Email.create(email)`.
2. `userRepository.countByAccount(accountId)` → se ≥ 2, lança `BusinessRuleError("invite.account_full")`.
3. `userRepository.findByEmail(email)` → se pertencer a esta conta, lança `BusinessRuleError("invite.already_member")`. Se for usuário de outra conta, lança `BusinessRuleError("invite.email_in_use")`.
4. `inviteRepository.findActivePending(accountId, email)` → se já houver convite pendente não expirado, lança `BusinessRuleError("invite.already_pending")`.
5. Gera `token = tokenGenerator.generate()`; cria `Invite` com `ttlHours = 48`.
6. Persiste via `inviteRepository.create`.
7. Chama `mailer.sendInvite({ to, inviterName, accountName, acceptUrl: ${baseUrl}/convite/${token} })`. Se mailer falha, rollback: `inviteRepository.delete` (ou manter como pending — **ver Riscos**).

**AcceptInviteUseCase:**

1. `InviteToken.create(token)`.
2. `inviteRepository.findByToken` → se `null`, `BusinessRuleError("invite.not_found")`.
3. `invite.isUsable(now)` → se falso, `BusinessRuleError("invite.expired_or_used")`.
4. Re-valida limite: `userRepository.countByAccount(invite.accountId) < 2`.
5. Valida senha (tamanho mínimo).
6. `prisma.$transaction`: cria `User` com a `accountId` do invite + `invite.markAccepted()` + `update`.
7. Retorna `{ userId, accountId }`.

### Modelos de Dados

O schema Prisma já contém `Invite` (ver `prisma/schema.prisma:31-40`). Uso dos campos:

| Campo       | Uso                                                     |
| ----------- | ------------------------------------------------------- |
| `id`        | cuid gerado pelo Prisma                                 |
| `accountId` | conta dona do convite                                   |
| `email`     | destinatário (lowercased pelo VO `Email`)               |
| `token`     | 64 chars hex, `@unique`                                 |
| `status`    | `"pending" \| "accepted" \| "expired"` (string no banco)|
| `expiresAt` | `now + 48h`                                             |
| `createdAt` | default now                                             |

**Nenhuma alteração de schema é necessária nessa fase.** Sem migração.

**DTOs** (HTTP, via `zod` — adicionar a dependência nessa fase):

```ts
// schemas em app/api/**/schemas.ts (camada app, não domain)
RegisterInput = { name: string min 1, email: string email, password: string min 8 }
InviteCreateInput = { email: string email }
InviteAcceptInput = { name: string min 1, password: string min 8 }
```

### Endpoints de API

| Método | Caminho                    | Auth         | Descrição                                         |
| ------ | -------------------------- | ------------ | ------------------------------------------------- |
| POST   | `/api/auth/register`       | público      | cria conta + usuário → retorna `{ userId, accountId }` |
| GET    | `/api/auth/[...nextauth]`  | público      | existente (NextAuth)                              |
| POST   | `/api/invites`             | autenticado  | cria convite para e-mail do body                  |
| GET    | `/api/invites/[token]`     | público      | valida token → `{ accountName, email }` ou 410    |
| POST   | `/api/invites/[token]`     | público      | aceita convite → cria user → retorna `{ userId }` |

**Contratos de resposta (sucesso / erro):**

- 2xx: JSON com payload específico.
- 400: `{ error: "validation", details: zod-issues[] }`.
- 401: `{ error: "unauthenticated" }`.
- 403: `{ error: "forbidden" }`.
- 409: `{ error: code }` onde `code ∈ {email.duplicate, invite.account_full, invite.already_member, invite.already_pending, invite.email_in_use}`.
- 410: `{ error: "invite.expired_or_used" }`.
- 404: `{ error: "invite.not_found" }`.

**Mapeamento erro → HTTP** centralizado em `src/app/api/_lib/error-handler.ts`:

```ts
mapDomainError(e: unknown): NextResponse
// InvalidValueError → 400
// BusinessRuleError → 409 (exceto códigos específicos: expired_or_used → 410, not_found → 404)
```

### Componentes Front-End

- **`/cadastro`** (`app/(auth)/cadastro/page.tsx`): Server Component + `<RegisterForm>` (Client Component). Form com `name`, `email`, `password`. `action` via Server Action chamando `fetch("/api/auth/register")` → em sucesso, dispara `signIn("credentials", { email, password, redirect: true, callbackUrl: "/dashboard" })`.
- **`/login`** (`app/(auth)/login/page.tsx`): usa `<LoginForm>` que chama `signIn("credentials", ...)` diretamente. Fidelidade visual ao `LoginScreen` em `docs/RodagemApp.html` (tokens âmbar, logo, max-w-[430px]).
- **`/convite/[token]`**: Server Component carrega o convite via `fetch` server-side (ou direto do use case, pois o layout já é server). Renderiza `<AcceptInviteForm>` com `name`/`password` em caso válido, ou `<InviteError status=...>` em caso de token expirado/usado/não-encontrado.
- **Auth guard**: duas camadas redundantes:
  1. `src/middleware.ts` usando `next-auth/middleware` com matcher `["/dashboard/:path*", "/veiculos/:path*", "/abastecimento/:path*", "/manutencao/:path*", "/relatorios/:path*", "/configuracoes/:path*"]` → redireciona para `/login`.
  2. `app/(app)/layout.tsx` chama `getServerSession(authOptions)`; sem sessão → `redirect("/login")`. Garante que qualquer rota do grupo herde a proteção mesmo se o matcher do middleware falhar.

---

## Pontos de Integração

- **NextAuth.js v4** (já instalado e configurado em `nextauth.config.ts`). O `authorize` já busca user via `UserRepository` e valida com `Argon2PasswordHasher`. Nada a alterar além dos _callbacks_, onde é preciso garantir que `userId` (não só `accountId`) seja exposto na sessão para uso nas API routes.
- **Mailer**: port `Mailer` já existe (`application/ports/mailer.ts`). Nessa fase continua usando `NoopMailer` (loga no console). Um adapter real (Resend/SMTP) é item da Fase 8.
- **Prisma**: reusa `prisma.client.ts` singleton. Transações via `prisma.$transaction(async (tx) => …)` precisam ser passadas aos repositórios — adicionar overload `create(entity, tx?: Prisma.TransactionClient)` nos repositórios ou expor o client diretamente ao use case (mais simples no MVP — adotar).

---

## Análise de Impacto

| Componente Afetado                          | Tipo de Impacto         | Descrição & Risco                                                   | Ação Requerida                                  |
| ------------------------------------------- | ----------------------- | ------------------------------------------------------------------- | ----------------------------------------------- |
| `nextauth.config.ts`                        | Mudança menor           | Adicionar `userId` nos callbacks `jwt`/`session`. Baixo risco.      | Atualizar tipos de sessão em `types/next-auth.d.ts` |
| `UserRepository` + `prisma-user.repository` | Novo método             | `countByAccount(accountId)`. Baixo risco.                           | Extender interface e impl                       |
| `container.ts`                              | Nova wiring             | Registra `InviteRepository`, `TokenGenerator`, use cases.           | Atualizar arquivo                               |
| `eslint boundaries`                         | Nenhum                  | Use cases em `application/` só dependem de `domain/` + ports.       | —                                               |
| `prisma/schema.prisma`                      | Nenhum                  | Modelo `Invite` já existe. Sem migração.                            | —                                               |
| `package.json`                              | Nova dep                | `zod` (~16kb gz) para validação de input nas API routes.            | `npm install zod`                               |
| `src/app/(app)/layout.tsx`                  | Nova rota               | Route group protegido. Ainda não existe — cria com auth guard.      | —                                               |
| `src/middleware.ts`                         | Novo arquivo            | Matcher para rotas protegidas. Baixo risco.                         | —                                               |

---

## Abordagem de Testes

### Testes Unitários (Vitest — `tests/unit/`)

- **`domain/account/invite.entity.test.ts`**: `create` com TTL, `isExpired`, `isUsable`, transições (`pending → accepted`; não permite re-accept).
- **Use cases** (`tests/unit/application/usecases/account/*.test.ts`): mocks de repositórios/port (fakes em memória, preferencialmente, em linha com `noop.mailer.test.ts`):
  - `register-account`: sucesso cria conta + user; duplicate email → erro; senha curta → `InvalidValueError`.
  - `invite-user`: conta cheia → erro `account_full`; convite duplicado ativo → erro; sucesso → chama `mailer.sendInvite` com `acceptUrl` esperado.
  - `accept-invite`: token inválido/expirado/aceito → erros específicos; sucesso → cria user, marca convite como accepted.
- **`infrastructure/auth/token-generator.test.ts`**: gera strings hex de 64 chars distintas.
- **`infrastructure/database/prisma-invite.repository.test.ts`**: smoke test com o SQLite de dev (padrão dos repos já existentes em `tests/unit/infrastructure/database/`).

### Testes de Integração

Fora do escopo do MVP desta fase — API routes serão cobertas por testes manuais (smoke) via `curl`/navegador. Cobertura de rota via Vitest + `next-test-api-route-handler` é item da Fase 8.

---

## Sequenciamento de Desenvolvimento

### Ordem de Construção

1. **Domínio `Invite`** (entidade + repositório interface + testes). Sem dependência de nada novo; desbloqueia use cases.
2. **`UserRepository.countByAccount`** (interface + impl Prisma + teste). Pequeno e isolado.
3. **`TokenGenerator` port + impl**. Simples.
4. **`RegisterAccountUseCase`** (+ testes). Desbloqueia a tela de cadastro imediatamente.
5. **`InviteUserUseCase`** + **`AcceptInviteUseCase`** (+ testes). Dependem de 1-3.
6. **`PrismaInviteRepository`** + teste.
7. **Container wiring** (`container.ts`).
8. **API routes**: `register` → `invites` (POST) → `invites/[token]` (GET/POST). Inclui `error-handler` + schemas zod.
9. **`next-auth.d.ts`** com tipos de sessão (adicionando `userId`).
10. **Middleware + layout `(app)/`** para auth guard.
11. **Páginas e componentes** (`LoginForm`, `RegisterForm`, `AcceptInviteForm`, páginas). Fidelidade visual ao protótipo.
12. **Smoke test manual** em dev: cadastro → login → convite → aceite → logout.

### Dependências Técnicas

- `zod` (instalar).
- `SMTP_*` / provedor real de e-mail: **não necessário** nessa fase (NoopMailer loga no console; o link do convite pode ser copiado do terminal durante o dev).

---

## Monitoramento e Observabilidade

Projeto MVP sem stack Prometheus/Grafana. Observabilidade = logs estruturados via `console.info`/`console.warn` em momentos-chave:

- `register.success`, `register.duplicate_email`.
- `invite.created`, `invite.account_full`, `invite.accepted`, `invite.expired`.
- Falhas inesperadas em API routes → `console.error` com stack (capturadas pelo `error-handler`).

Em produção (Vercel), logs ficam disponíveis no dashboard. Métricas agregadas ficam para a Fase 8.

---

## Considerações Técnicas

### Decisões Principais

- **Argon2id em vez de bcrypt** — o PRD menciona bcrypt, mas `Argon2PasswordHasher` já está implementado e é o padrão moderno recomendado pelo OWASP. Mantemos Argon2. _(Trade-off: dependência nativa com build; já validado na Fase 1.)_
- **Auth guard em duas camadas (middleware + layout)** — o middleware é barato e protege antes do render; o layout garante defesa em profundidade caso o matcher evolua de forma incompleta.
- **Token atômico criado via `crypto.randomBytes(32)`** (256 bits) — compatível com o regex do `InviteToken` VO (`^[0-9a-f]{32,}$`) e cobre amplamente o requisito de imprevisibilidade.
- **Limite de usuários verificado no servidor em 2 pontos** (no `invite-user` e no `accept-invite`) — evita race quando dois convites são aceitos ao mesmo tempo.
- **zod nos boundaries HTTP**, não em domain/application — preserva a fronteira arquitetural (domínio só conhece `Email`/`InviteToken`, não zod).
- **Session callback passa a incluir `userId`** — várias rotas (especialmente `POST /api/invites`) precisam registrar o _inviter_. Atualmente só há `accountId`.

### Riscos Conhecidos

1. **Envio de e-mail no fluxo de convite pode falhar após persistir o Invite.** _Mitigação:_ como o mailer atual é Noop, não há falha real. Quando um mailer real for adotado, envolver `create invite + sendInvite` em um fluxo compensatório (tentar enviar; se falhar, marcar invite como `expired` ou deletar).
2. **Race condition no limite de 2 usuários.** Dois convites podem ser aceitos simultaneamente. _Mitigação:_ a transação de `AcceptInviteUseCase` lê `countByAccount` dentro do `$transaction`; em SQLite (dev) isso é serializado naturalmente, em MySQL (prod) um `SELECT FOR UPDATE` equivalente via `tx.user.count` dentro da mesma transação reduz a janela — risco residual aceitável para MVP.
3. **Expiração não é "passiva"** — um convite pendente permanece com `status = "pending"` mesmo após `expiresAt`. O método `isUsable(now)` trata isso em runtime, mas as queries de "invite ativo" precisam filtrar `expiresAt > now`. Cron job para marcar como `expired` é fora do escopo.
4. **Auto-registro de `name` da conta** — o PRD não define se o nome da `Account` deve ser editável. Decisão: usar o nome do usuário registrado por default; edição fica para a Fase 7 (Configurações).

### Requisitos Especiais

- **Segurança:**
  - Respostas de login não revelam se o e-mail existe (já implementado em `nextauth.config.ts:19-27`).
  - Token de convite é one-shot (marcado `accepted` após uso).
  - `passwordHash` nunca é retornado em responses.
  - Rate limiting **fora de escopo** desta fase (Fase 8).

### Conformidade com Padrões

- Respeita a regra `eslint-plugin-boundaries`: `domain/` puro; `application/` só depende de `domain/` e `ports/`; `infrastructure/` pode depender dos dois anteriores; `app/` compõe tudo via `container.ts`.
- Segue o padrão existente de VOs (`create`/`rehydrate`), entidades (`private constructor`, factories), repositórios (interface em `domain/`, impl em `infrastructure/database/repositories/`).
- Tratamento de erros segue o padrão: `InvalidValueError` para inputs malformados, `BusinessRuleError` com `code` para regras de negócio violadas; mapeamento HTTP centralizado.
- Testes em `tests/unit/<layer>/...` espelhando `src/<layer>/`.

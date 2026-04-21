---
status: completed
parallelizable: true
blocked_by: ["9.0"]
---

<task_context>
<domain>back/api/invites</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server</dependencies>
</task_context>

# Tarefa 11.0: API routes /api/invites e /api/invites/[token]

## Visão Geral

Três rotas HTTP para o ciclo de convite:

- `POST /api/invites` — autenticado, cria convite pela sessão do usuário
- `GET /api/invites/[token]` — público, valida token e retorna dados para a UI
- `POST /api/invites/[token]` — público, aceita convite e cria usuário

<requirements>
- POST /api/invites requer `getServerSession(authOptions)`; sem sessão → 401
- Schemas zod para cada body
- Mapeamento de erros via `mapDomainError`
- `runtime = "nodejs"` nas duas rotas (argon2 no accept)
- GET retorna `{ accountName, email }` em sucesso, 404/410 em token inválido/expirado
</requirements>

## Subtarefas

- [x] 11.1 Criar `src/app/api/invites/route.ts` com `POST`
- [x] 11.2 Criar `src/app/api/invites/[token]/route.ts` com `GET` e `POST`
- [x] 11.3 Schemas zod em arquivos irmãos (`schema.ts`)
- [x] 11.4 `GET` chama `inviteRepository.findByToken` + `account.findById`; valida `isUsable(now)` e mapeia erros
- [x] 11.5 `POST` delega a `acceptInviteUseCase`
- [ ] 11.6 Teste manual via `curl` coberto no review
- [x] 11.7 Rodar `npm run lint`

## Detalhes de Implementação

```ts
// POST /api/invites
const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
const parsed = InviteCreateSchema.safeParse(await req.json());
// ...
const out = await inviteUserUseCase.execute({
  accountId: session.accountId, inviterUserId: session.userId, email: parsed.data.email,
});
```

Em `GET /api/invites/[token]`, a responsabilidade é apenas _informativa_ — não há efeito colateral. Pode chamar repositório direto (camada app) em vez de um use case dedicado:

```ts
const invite = await inviteRepository.findByToken(InviteToken.create(token));
if (!invite) return NextResponse.json({ error: "invite.not_found" }, { status: 404 });
if (!invite.isUsable(new Date())) return NextResponse.json({ error: "invite.expired_or_used" }, { status: 410 });
const account = await accountRepository.findById(invite.accountId);
return NextResponse.json({ email: invite.email.value, accountName: account!.name });
```

## Critérios de Sucesso

- `POST /api/invites` sem sessão → 401.
- `POST /api/invites` com conta cheia → 409 `invite.account_full`.
- `GET /api/invites/<tokenvalido>` → 200 com `{ email, accountName }`.
- `GET /api/invites/<tokeninvalido>` → 404.
- `POST /api/invites/<token>` com body válido → 201 + `{ userId, accountId }`.
- Lint verde.

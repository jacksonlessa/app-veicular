---
status: completed
parallelizable: true
blocked_by: ["1.0"]
---

<task_context>
<domain>back/domain/account</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 2.0: Domínio Invite — entidade + InviteRepository + testes

## Visão Geral

Modelar o convite no domínio. Criar a entidade `Invite` com seu ciclo de vida (`pending → accepted`, detecção de expirado) e a interface `InviteRepository` que será implementada na infraestrutura. Base para os use cases de convite.

<requirements>
- `Invite` com factories `create` (TTL em horas) e `rehydrate`
- Campos: `id`, `accountId`, `email (Email VO)`, `token (InviteToken VO)`, `status ("pending"|"accepted"|"expired")`, `expiresAt`, `createdAt`
- Métodos: `isExpired(now)`, `isUsable(now)`, `markAccepted()` (erro se não-pending)
- `InviteRepository` com `findByToken`, `create`, `update`, `findActivePending(accountId, email)`
- Testes cobrindo todos os métodos/transições
</requirements>

## Subtarefas

- [x] 2.1 Criar `src/domain/account/entities/invite.entity.ts`
- [x] 2.2 Exportar tipo `InviteStatus` e usar `InvalidValueError`/`BusinessRuleError` onde cabe
- [x] 2.3 Criar `src/domain/account/repositories/invite.repository.ts`
- [x] 2.4 Criar testes em `tests/unit/domain/account/invite.entity.test.ts`
- [x] 2.5 Rodar `npm test` e `npm run lint`

## Detalhes de Implementação

```ts
export type InviteStatus = "pending" | "accepted" | "expired";

export class Invite {
  static create(input: {
    id: string; accountId: string; email: Email;
    token: InviteToken; ttlHours: number; now?: Date;
  }): Invite;  // status "pending", expiresAt = now + ttlHours
  static rehydrate(props: InviteProps): Invite;

  isExpired(now: Date): boolean;          // now >= expiresAt
  isUsable(now: Date): boolean;           // status === "pending" && !isExpired
  markAccepted(): void;                   // BusinessRuleError se não usable
}
```

```ts
// domain/account/repositories/invite.repository.ts
export interface InviteRepository {
  findByToken(token: InviteToken): Promise<Invite | null>;
  findActivePending(accountId: string, email: Email): Promise<Invite | null>;
  create(invite: Invite): Promise<Invite>;
  update(invite: Invite): Promise<Invite>;
}
```

## Critérios de Sucesso

- `Invite.create({ ttlHours: 48 })` gera invite com `expiresAt ≈ now + 48h` e `status = "pending"`.
- `isUsable(now)` retorna `false` após expirar ou após `markAccepted()`.
- `markAccepted()` lança `BusinessRuleError` se o invite já não for `pending` ou se expirou.
- Cobertura ≥ 95% em `src/domain/account/entities/invite.entity.ts`.

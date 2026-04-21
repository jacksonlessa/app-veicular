---
status: completed
parallelizable: true
blocked_by: ["2.0"]
---

<task_context>
<domain>back/infra/database</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 5.0: PrismaInviteRepository + teste

## Visão Geral

Implementar a interface `InviteRepository` sobre Prisma, mapeando o modelo `Invite` do `schema.prisma` (já existente) para a entidade de domínio. Seguir o padrão de `PrismaUserRepository` / `PrismaAccountRepository`.

<requirements>
- Mappers `toEntity` e `toPersistence`
- `findByToken`, `findActivePending`, `create`, `update` implementados
- Teste usando SQLite de dev, análogo aos repos Prisma já existentes
- Tratar duplicidade de token (P2002) — improvável mas documentar
</requirements>

## Subtarefas

- [x] 5.1 Criar `src/infrastructure/database/repositories/prisma-invite.repository.ts`
- [x] 5.2 Implementar mappers usando `Email.create(row.email)` e `InviteToken.create(row.token)`
- [x] 5.3 `findActivePending` filtra `status = "pending"` e `expiresAt > now`
- [x] 5.4 `update` usa `prisma.invite.update({ where: { id } })` para persistir mudança de status
- [x] 5.5 Teste em `tests/unit/infrastructure/database/prisma-invite.repository.test.ts`
- [x] 5.6 Rodar `npm test` e `npm run lint`

## Detalhes de Implementação

Analisar `prisma-user.repository.ts` como referência de padrão (mappers + tratamento de `P2002`). Em `toEntity`, usar `Invite.rehydrate` com cast de `row.status` para `InviteStatus` (validar que pertence ao enum — caso contrário, `InvalidValueError`).

Cenários de teste:
- `create` + `findByToken` retorna o mesmo invite.
- `findByToken` retorna `null` para token inexistente.
- `findActivePending` retorna o invite ativo; retorna `null` após `update` para `accepted` ou após `expiresAt` no passado.

## Critérios de Sucesso

- Todas as 4 operações testadas e verdes.
- Cobertura ≥ 85% no arquivo novo.
- Lint verde.

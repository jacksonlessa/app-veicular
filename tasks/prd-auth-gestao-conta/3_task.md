---
status: completed
parallelizable: true
blocked_by: ["1.0"]
---

<task_context>
<domain>back/domain/account</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 3.0: Estender UserRepository com countByAccount

## Visão Geral

Adicionar `countByAccount(accountId)` à interface `UserRepository` e ao `PrismaUserRepository`. Necessário para impor o limite de 2 usuários por conta nos use cases `InviteUserUseCase` e `AcceptInviteUseCase`.

<requirements>
- Novo método na interface retornando `Promise<number>`
- Implementação Prisma usando `prisma.user.count({ where: { accountId } })`
- Teste que verifica contagens 0/1/2 sobre um banco de teste
</requirements>

## Subtarefas

- [x] 3.1 Adicionar `countByAccount(accountId: string): Promise<number>` em `src/domain/account/repositories/user.repository.ts`
- [x] 3.2 Implementar em `src/infrastructure/database/repositories/prisma-user.repository.ts`
- [x] 3.3 Adicionar teste em `tests/unit/infrastructure/database/prisma-user.repository.test.ts` (setup cria conta com 0, 1 e 2 usuários e valida contagem)
- [x] 3.4 Rodar `npm test` e `npm run lint`

## Detalhes de Implementação

O teste pode seguir o padrão já existente em `prisma-user.repository.test.ts`, usando o mesmo SQLite de dev (ou um banco temporário se já houver essa infra). Garantir isolamento limpando a tabela ao final ou usando ids únicos.

## Critérios de Sucesso

- Contagem correta para 0, 1 e 2 usuários na mesma conta.
- Contagens isoladas entre contas (criar duas contas, confirmar independência).
- Lint + testes verdes.

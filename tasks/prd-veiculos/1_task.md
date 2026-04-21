---
status: in-progress
parallelizable: false
blocked_by: []
---

<task_context>
<domain>infra/database</domain>
<type>implementation</type>
<scope>configuration</scope>
<complexity>low</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 1.0: Migração Prisma — adicionar `deletedAt` ao modelo Vehicle

## Visão Geral

O modelo `Vehicle` no schema Prisma não possui campo de soft delete. Esta task adiciona `deletedAt DateTime?` ao modelo e gera a migration correspondente. É o pré-requisito de toda a Fase 3.

<requirements>
- Adicionar `deletedAt DateTime?` ao modelo `Vehicle` em `prisma/schema.prisma`
- Gerar a migration com `npx prisma migrate dev --name add_vehicle_deleted_at`
- Confirmar que a migration foi aplicada e o Prisma Client foi regenerado
</requirements>

## Subtarefas

- [ ] 1.1 Editar `prisma/schema.prisma` — adicionar `deletedAt DateTime?` ao modelo `Vehicle`
- [ ] 1.2 Executar `npx prisma migrate dev --name add_vehicle_deleted_at`
- [ ] 1.3 Verificar que `npx prisma generate` completou sem erros
- [ ] 1.4 Confirmar que o tipo `Vehicle` do Prisma Client inclui o campo `deletedAt`

## Detalhes de Implementação

Adicionar no modelo `Vehicle` do schema (após `createdAt`):

```prisma
model Vehicle {
  id              String        @id @default(cuid())
  accountId       String
  name            String
  brand           String?
  model           String?
  color           String?
  plate           String?
  initOdometer    Int
  currentOdometer Int
  createdAt       DateTime      @default(now())
  deletedAt       DateTime?     // ← NOVO
  account         Account       @relation(fields: [accountId], references: [id])
  fuelups         Fuelup[]
  maintenances    Maintenance[]
}
```

A coluna é nullable, portanto a migration é segura para dados existentes (todos os registros receberão `NULL`).

## Critérios de Sucesso

- `prisma/schema.prisma` contém `deletedAt DateTime?` no modelo `Vehicle`
- Migration gerada em `prisma/migrations/` com o nome `add_vehicle_deleted_at`
- `npx prisma migrate dev` termina sem erros
- TypeScript reconhece `vehicle.deletedAt` como `Date | null` após `npx prisma generate`

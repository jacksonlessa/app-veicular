---
status: completed
parallelizable: true
blocked_by: ["1.0"]
---

<task_context>
<domain>back</domain>
<type>implementation</type>
<scope>configuration</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 3.0: Configurar Prisma com SQLite e schema completo

## Visão Geral

Instalar Prisma, declarar todas as 7 tabelas do escopo no `schema.prisma`, aplicar a migration inicial em SQLite local e expor o cliente Prisma como singleton em `src/infrastructure/database/prisma.client.ts`.

<requirements>
- Prisma + @prisma/client instalados
- `prisma/schema.prisma` com datasource SQLite e 7 models: Account, User, Invite, Vehicle, Fuelup, Maintenance, MaintenanceItem
- Migration inicial aplicada gerando `prisma/dev.db`
- Singleton em `src/infrastructure/database/prisma.client.ts` evitando múltiplas conexões em hot-reload
- `prisma/dev.db*` no `.gitignore`
</requirements>

## Subtarefas

- [x] 3.1 `npm i @prisma/client` e `npm i -D prisma`
- [x] 3.2 `npx prisma init --datasource-provider sqlite`
- [x] 3.3 Escrever `schema.prisma` com os 7 models (ver TechSpec)
- [x] 3.4 Rodar `npx prisma migrate dev --name init`
- [x] 3.5 Criar `src/infrastructure/database/prisma.client.ts` com singleton
- [x] 3.6 Adicionar `prisma/dev.db*` ao `.gitignore`

## Detalhes de Implementação

Schema completo no TechSpec seção "Design de Implementação". Singleton:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Relações: `MaintenanceItem` usa `onDelete: Cascade`. FKs em todos os models filhos conforme escopo seção 12.2.

## Critérios de Sucesso

- `npx prisma migrate dev` aplica sem erros
- `prisma/dev.db` criado
- `npx prisma studio` abre e lista as 7 tabelas
- `import { prisma } from "@/infrastructure/database/prisma.client"` resolve

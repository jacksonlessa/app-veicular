---
status: in-progress
parallelizable: false
blocked_by: ["4.0", "5.0"]
---

<task_context>
<domain>infra/container</domain>
<type>integration</type>
<scope>configuration</scope>
<complexity>low</complexity>
<dependencies></dependencies>
</task_context>

# Tarefa 6.0: Container wiring + mapeamento de erros no error-handler

## Visão Geral

Registra o repositório e os 5 use cases novos no container de DI, e mapeia eventuais erros de domínio da manutenção no `error-handler` global das API routes.

<requirements>
- Registrar `PrismaMaintenanceRepository` no `container.ts`
- Instanciar e exportar os 5 use cases (`register`, `update`, `delete`, `get`, `list`)
- Verificar se `error-handler.ts` já cobre os erros usados (`NotFoundError`, `ForbiddenError`, `BusinessRuleError`); adicionar mapeamentos apenas se ausentes
- Não remover nem alterar bindings existentes
</requirements>

## Subtarefas

- [ ] 6.1 Importar e instanciar `PrismaMaintenanceRepository` em `container.ts`
- [ ] 6.2 Instanciar os 5 use cases passando repositório, `txRunner` e dependências necessárias
- [ ] 6.3 Exportar os 5 use cases do container
- [ ] 6.4 Revisar `error-handler.ts` e adicionar mapeamentos ausentes (se houver)
- [ ] 6.5 Rodar `npm run build` e verificar que não há erros de tipo
- [ ] 6.6 Rodar `npm test` verde

## Detalhes de Implementação

```ts
// container.ts (trecho a adicionar)
import { PrismaMaintenanceRepository } from "@/infrastructure/database/repositories/prisma-maintenance.repository";
import { RegisterMaintenanceUseCase } from "@/application/usecases/maintenance/register-maintenance.usecase";
// ... outros imports

const maintenanceRepository = new PrismaMaintenanceRepository(prismaClient);

export const registerMaintenanceUseCase = new RegisterMaintenanceUseCase(
  vehicleRepository,
  fuelupRepository,
  maintenanceRepository,
  txRunner,
);
export const updateMaintenanceUseCase = new UpdateMaintenanceUseCase(
  vehicleRepository,
  fuelupRepository,
  maintenanceRepository,
  txRunner,
);
export const deleteMaintenanceUseCase = new DeleteMaintenanceUseCase(
  vehicleRepository,
  fuelupRepository,
  maintenanceRepository,
  txRunner,
);
export const getMaintenanceUseCase = new GetMaintenanceUseCase(vehicleRepository, maintenanceRepository);
export const listMaintenancesUseCase = new ListMaintenancesUseCase(vehicleRepository, maintenanceRepository);
```

## Critérios de Sucesso

- `npm run build` sem erros de tipo
- `npm test` verde
- `npm run lint` verde
- Nenhum binding existente removido ou alterado

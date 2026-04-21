---
status: completed
parallelizable: false
blocked_by: ["3.0"]
---

<task_context>
<domain>infra/container</domain>
<type>integration</type>
<scope>configuration</scope>
<complexity>low</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 4.0: Container + Error handler — registrar use cases e mapear novos erros

## Visão Geral

Registrar o `PrismaVehicleRepository` e os quatro use cases de veículos no container de dependências (`src/infrastructure/container.ts`), e adicionar os mapeamentos de erro `vehicle.limit_reached` e `vehicle.not_found` ao helper `mapDomainError`.

<requirements>
- Exportar `vehicleRepository`, `listVehiclesUseCase`, `createVehicleUseCase`, `updateVehicleUseCase`, `deleteVehicleUseCase` de `src/infrastructure/container.ts`
- Adicionar mapeamentos em `src/app/api/_lib/error-handler.ts`:
  - `vehicle.not_found` → 404
  - `vehicle.limit_reached` → 409
</requirements>

## Subtarefas

- [ ] 4.1 Adicionar imports de `PrismaVehicleRepository` e dos 4 use cases em `container.ts`
- [ ] 4.2 Instanciar `vehicleRepository = new PrismaVehicleRepository(prisma)`
- [ ] 4.3 Instanciar e exportar os 4 use cases de veículo
- [ ] 4.4 Adicionar `vehicle.not_found` → 404 em `error-handler.ts`
- [ ] 4.5 Adicionar `vehicle.limit_reached` → 409 em `error-handler.ts`

## Detalhes de Implementação

### container.ts — adições

```typescript
import { PrismaVehicleRepository } from "@/infrastructure/database/repositories/prisma-vehicle.repository";
import { ListVehiclesUseCase } from "@/application/usecases/vehicle/list-vehicles.usecase";
import { CreateVehicleUseCase } from "@/application/usecases/vehicle/create-vehicle.usecase";
import { UpdateVehicleUseCase } from "@/application/usecases/vehicle/update-vehicle.usecase";
import { DeleteVehicleUseCase } from "@/application/usecases/vehicle/delete-vehicle.usecase";

export const vehicleRepository = new PrismaVehicleRepository(prisma);

export const listVehiclesUseCase   = new ListVehiclesUseCase(vehicleRepository);
export const createVehicleUseCase  = new CreateVehicleUseCase(vehicleRepository);
export const updateVehicleUseCase  = new UpdateVehicleUseCase(vehicleRepository);
export const deleteVehicleUseCase  = new DeleteVehicleUseCase(vehicleRepository);
```

### error-handler.ts — adições

Localizar a função `mapDomainError` (ou equivalente) e adicionar ao mapeamento de `BusinessRuleError`:

```typescript
"vehicle.not_found":    404,
"vehicle.limit_reached": 409,
```

## Critérios de Sucesso

- `container.ts` exporta os 5 novos símbolos sem erros de TypeScript
- `mapDomainError` retorna 404 para `vehicle.not_found` e 409 para `vehicle.limit_reached`
- `npx tsc --noEmit` sem erros
- Nenhum teste existente quebra

---
status: pending
parallelizable: false
blocked_by: ["2.0", "3.0"]
---

<task_context>
<domain>application/usecases/maintenance</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 5.0: `DeleteMaintenanceUseCase` + `ListMaintenancesUseCase` + `GetMaintenanceUseCase` + testes

## Visão Geral

Implementa os três use cases de leitura e deleção. Dependem do repositório (task 2.0) e das entidades (task 3.0). Podem ser desenvolvidos em paralelo com a task 4.0.

<requirements>
- `GetMaintenanceUseCase`: busca por ID, valida ownership via `vehicleId → accountId`, retorna `MaintenanceDTO`
- `ListMaintenancesUseCase`: lista por `vehicleId`, valida ownership, retorna `MaintenanceDTO[]`
- `DeleteMaintenanceUseCase`: busca manutenção, valida ownership, recomputa `newCurrentOdometer` (excluindo a manutenção deletada) usando `computeNewOdometer`, chama `txRunner.deleteMaintenance()`
- Testes unitários para os três use cases
</requirements>

## Subtarefas

- [ ] 5.1 Criar `src/application/usecases/maintenance/get-maintenance.usecase.ts`
- [ ] 5.2 Criar `src/application/usecases/maintenance/list-maintenances.usecase.ts`
- [ ] 5.3 Criar `src/application/usecases/maintenance/delete-maintenance.usecase.ts`
- [ ] 5.4 Escrever testes unitários para `GetMaintenanceUseCase`
- [ ] 5.5 Escrever testes unitários para `ListMaintenancesUseCase`
- [ ] 5.6 Escrever testes unitários para `DeleteMaintenanceUseCase`
- [ ] 5.7 Rodar `npm test` verde

## Detalhes de Implementação

**`GetMaintenanceUseCase.execute({ id, accountId })`:**

```ts
const maintenance = await repo.findById(id);
if (!maintenance) throw new NotFoundError("Maintenance");
const vehicle = await vehicleRepo.findById(maintenance.vehicleId);
if (vehicle.accountId !== accountId) throw new ForbiddenError();
return toMaintenanceDTO(maintenance);
```

**`ListMaintenancesUseCase.execute({ vehicleId, accountId })`:**

```ts
const vehicle = await vehicleRepo.findById(vehicleId);
if (!vehicle || vehicle.accountId !== accountId) throw new ForbiddenError();
const maintenances = await repo.findByVehicleId(vehicleId);
return maintenances.map(toMaintenanceDTO);
```

**`DeleteMaintenanceUseCase.execute({ id, accountId })` (fluxo):**

1. Busca manutenção; valida ownership.
2. Busca fuelups e demais manutenções do veículo (excluindo a que será deletada).
3. Computa `newCurrentOdometer` via `computeNewOdometer` (task 4.0 shared util).
4. Chama `txRunner.deleteMaintenance({ maintenanceId: id, vehicleId, recalculateOdometer: true, newCurrentOdometer })`.

> Se a manutenção deletada não tinha odômetro, `recalculateOdometer = false` e o veículo não é atualizado.

**Casos de teste críticos:**

| Use Case | Cenário | Esperado |
|----------|---------|----------|
| `Get` | ID inexistente | `NotFoundError` |
| `Get` | Account errado | `ForbiddenError` |
| `List` | Vehicle de outro account | `ForbiddenError` |
| `Delete` | Manutenção com odômetro | Recalcula `currentOdometer` |
| `Delete` | Manutenção sem odômetro | `recalculateOdometer = false` |

## Critérios de Sucesso

- Três use cases implementados sem `any` ou TODOs
- Todos os cenários da tabela cobertos por testes
- `npm test` e `npm run lint` verdes

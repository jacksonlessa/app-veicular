---
status: pending
parallelizable: false
blocked_by: ["1.0", "3.0"]
---

<task_context>
<domain>application/usecases/maintenance</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 4.0: `RegisterMaintenanceUseCase` + `UpdateMaintenanceUseCase` + testes

## Visão Geral

Implementa os dois use cases de escrita que alteram dados. Ambos precisam do `TransactionRunner` (task 1.0) e das entidades de domínio (task 3.0). Inclui utilitário `computeNewOdometer` que considera fuelups **e** manutenções para calcular o `currentOdometer` do veículo.

<requirements>
- `RegisterMaintenanceUseCase`: valida ownership do veículo, constrói entidade, computa `newCurrentOdometer` (max entre fuelups, outras manutenções e novo odômetro), chama `txRunner.saveMaintenance({ mode: "create" })`
- `UpdateMaintenanceUseCase`: carrega manutenção existente, valida ownership, reconstrói itens, recalcula `totalPrice` e `newCurrentOdometer`, chama `txRunner.saveMaintenance({ mode: "update" })`
- Utilitário `_shared/compute-new-odometer.ts` recebe fuelups + manutenções e retorna `max(...odometers, vehicle.initOdometer)`
- `maintenance.dto.ts` com função `toMaintenanceDTO(entity: Maintenance): MaintenanceDTO`
- Testes unitários com repositórios fake para ambos os use cases
</requirements>

## Subtarefas

- [ ] 4.1 Criar `src/application/usecases/maintenance/_shared/compute-new-odometer.ts`
- [ ] 4.2 Criar `src/application/usecases/maintenance/register-maintenance.usecase.ts`
- [ ] 4.3 Criar `src/application/usecases/maintenance/update-maintenance.usecase.ts`
- [ ] 4.4 Criar `src/application/dtos/maintenance.dto.ts`
- [ ] 4.5 Escrever testes unitários para `RegisterMaintenanceUseCase`
- [ ] 4.6 Escrever testes unitários para `UpdateMaintenanceUseCase`
- [ ] 4.7 Rodar `npm test` verde

## Detalhes de Implementação

**`compute-new-odometer.ts` (multi-fonte):**

```ts
export function computeNewOdometer(params: {
  fuelupOdometers: number[];
  maintenanceOdometers: (number | null)[];
  newOdometer: number | undefined;
  initOdometer: number;
}): number | undefined {
  const candidates = [
    ...params.fuelupOdometers,
    ...params.maintenanceOdometers.filter((o): o is number => o !== null),
    ...(params.newOdometer !== undefined ? [params.newOdometer] : []),
  ];
  if (candidates.length === 0) return undefined;
  return Math.max(...candidates, params.initOdometer);
}
```

**`RegisterMaintenanceUseCase.execute()` (fluxo):**

1. Busca veículo; lança `NotFoundError` se não existir ou não pertencer ao account.
2. Busca todos os fuelups do veículo (via `FuelupRepository.findByVehicleId`).
3. Busca todas as manutenções existentes do veículo (via `MaintenanceRepository.findByVehicleId`).
4. Constrói `MaintenanceItem[]` a partir dos itens do input.
5. Chama `Maintenance.create()`.
6. Computa `newCurrentOdometer` via `computeNewOdometer`.
7. Chama `txRunner.saveMaintenance({ mode: "create", ... })`.
8. Retorna `toMaintenanceDTO(entity)`.

**`UpdateMaintenanceUseCase.execute()` (fluxo):**

1. Busca manutenção por ID; lança `NotFoundError` se ausente.
2. Valida ownership via `vehicleId → accountId`.
3. Reconstrói entidade com novos dados (incluindo novos itens).
4. Computa `newCurrentOdometer` excluindo a manutenção atual da lista.
5. Chama `txRunner.saveMaintenance({ mode: "update", ... })`.
6. Retorna `toMaintenanceDTO(entity)`.

**DTO:**

```ts
export type MaintenanceDTO = {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number | null;
  description: string | null;
  totalPrice: number;
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  createdAt: string;
};
```

## Critérios de Sucesso

- Use cases sem `any` ou TODOs
- `computeNewOdometer` considera fuelups + manutenções + initOdometer
- Testes unitários cobrem: sucesso, veículo de outro account (403), lista de itens vazia (erro), odômetro ausente (não atualiza veículo)
- `npm test` e `npm run lint` verdes

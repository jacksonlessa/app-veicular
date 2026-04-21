---
status: in-progress
parallelizable: false
blocked_by: ["2.0"]
---

<task_context>
<domain>application/usecases</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 3.0: Use cases — ListVehicles, CreateVehicle, UpdateVehicle, DeleteVehicle

## Visão Geral

Criar os quatro use cases de veículos em `src/application/usecases/vehicle/`, seguindo o padrão de `RegisterAccountUseCase` (input/output tipados, erros de domínio, sem acoplamento a HTTP).

<requirements>
- Criar `list-vehicles.usecase.ts`, `create-vehicle.usecase.ts`, `update-vehicle.usecase.ts`, `delete-vehicle.usecase.ts`
- Criar `src/application/dtos/vehicle.dto.ts` com a interface `VehicleDTO`
- `CreateVehicle`: validar limite de 2 veículos ativos por conta
- `UpdateVehicle` e `DeleteVehicle`: verificar ownership (accountId da sessão = vehicle.accountId)
- Ownership incorreto → `BusinessRuleError("vehicle.not_found")` (não expor que o veículo existe)
- `DeleteVehicle`: chamar `repository.delete()` (soft delete transparente)
</requirements>

## Subtarefas

- [ ] 3.1 Criar `src/application/dtos/vehicle.dto.ts`
- [ ] 3.2 Criar `list-vehicles.usecase.ts`
- [ ] 3.3 Criar `create-vehicle.usecase.ts` com validação de limite (max 2 por conta)
- [ ] 3.4 Criar `update-vehicle.usecase.ts` com ownership check e merge de props
- [ ] 3.5 Criar `delete-vehicle.usecase.ts` com ownership check

## Detalhes de Implementação

### VehicleDTO

```typescript
// src/application/dtos/vehicle.dto.ts
export interface VehicleDTO {
  id: string;
  name: string;
  plate: string | null;
  initOdometer: number;
  currentOdometer: number;
  createdAt: string; // ISO 8601
}
```

### ListVehiclesUseCase

```typescript
interface ListVehiclesInput  { accountId: string }
interface ListVehiclesOutput { vehicles: VehicleDTO[] }

// execute: repository.findByAccount(accountId) → mapear para VehicleDTO[]
```

### CreateVehicleUseCase

```typescript
interface CreateVehicleInput {
  accountId: string;
  name: string;
  plate?: string;
  initOdometer: number;
}
interface CreateVehicleOutput { vehicleId: string }

// execute:
// 1. findByAccount(accountId) → se count >= 2 → BusinessRuleError("vehicle.limit_reached")
// 2. VehicleName.create(name) → InvalidValueError se inválido
// 3. se plate → Plate.create(plate) → InvalidValueError se inválida
// 4. Odometer.create(initOdometer) → InvalidValueError se inválido
// 5. Vehicle.create({ id: cuid(), accountId, name, plate, initOdometer, currentOdometer: initOdometer, brand: "", model: "", color: "" })
// 6. repository.create(vehicle) → { vehicleId: vehicle.id }
```

### UpdateVehicleUseCase

```typescript
interface UpdateVehicleInput {
  vehicleId: string;
  accountId: string;
  name?: string;
  plate?: string | null;
  currentOdometer?: number;
}
interface UpdateVehicleOutput { vehicle: VehicleDTO }

// execute:
// 1. repository.findById(vehicleId) → null → BusinessRuleError("vehicle.not_found")
// 2. vehicle.accountId !== accountId → BusinessRuleError("vehicle.not_found")
// 3. construir novos VOs apenas para campos presentes no input
// 4. invariant currentOdometer >= initOdometer (Vehicle.rehydrate lança BusinessRuleError se violado)
// 5. Vehicle.rehydrate({ ...vehicle props, novos campos })
// 6. repository.update(updatedVehicle) → mapear para VehicleDTO
```

### DeleteVehicleUseCase

```typescript
interface DeleteVehicleInput { vehicleId: string; accountId: string }

// execute:
// 1. repository.findById(vehicleId) → null → BusinessRuleError("vehicle.not_found")
// 2. vehicle.accountId !== accountId → BusinessRuleError("vehicle.not_found")
// 3. repository.delete(vehicleId)
```

**Nota sobre `cuid()`:** verificar o import já usado no projeto (ex: `import { createId } from "@paralleldrive/cuid2"` ou similar). Seguir o mesmo padrão de `RegisterAccountUseCase`.

## Critérios de Sucesso

- 4 arquivos de use case criados em `src/application/usecases/vehicle/`
- `VehicleDTO` exportada de `src/application/dtos/vehicle.dto.ts`
- `CreateVehicle` lança `BusinessRuleError("vehicle.limit_reached")` quando conta tem 2 veículos ativos
- `UpdateVehicle` e `DeleteVehicle` lançam `BusinessRuleError("vehicle.not_found")` para ownership inválido
- TypeScript compila sem erros (`npx tsc --noEmit`)

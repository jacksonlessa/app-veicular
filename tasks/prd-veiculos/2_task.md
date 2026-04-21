---
status: in-progress
parallelizable: false
blocked_by: ["1.0"]
---

<task_context>
<domain>infra/database</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 2.0: PrismaVehicleRepository — implementar os 5 métodos com soft delete

## Visão Geral

O arquivo `src/infrastructure/database/repositories/prisma-vehicle.repository.ts` existe com todos os métodos lançando `NotImplementedError("Fase 3")`. Esta task substitui os stubs pela implementação real, seguindo o padrão de `PrismaUserRepository`.

<requirements>
- Implementar `findById`, `findByAccount`, `create`, `update`, `delete` em `PrismaVehicleRepository`
- `findByAccount` filtra `deletedAt: null` e ordena por `createdAt asc`
- `delete` executa soft delete: `UPDATE SET deletedAt = now()`, não `DELETE`
- Mapear entre entidade de domínio e modelo Prisma via helpers `toEntity` e `toPersistence`
- Seguir o padrão de `PrismaUserRepository` (captura de P2002, helpers locais)
</requirements>

## Subtarefas

- [ ] 2.1 Implementar helper `toEntity(raw: PrismaVehicle): Vehicle`
- [ ] 2.2 Implementar helper `toPersistence(vehicle: Vehicle): Prisma.VehicleCreateInput`
- [ ] 2.3 Implementar `findById` — busca por id, filtra `deletedAt: null`
- [ ] 2.4 Implementar `findByAccount` — filtra `accountId` e `deletedAt: null`, ordena `createdAt asc`
- [ ] 2.5 Implementar `create` — persiste veículo via `prisma.vehicle.create`
- [ ] 2.6 Implementar `update` — atualiza campos mutáveis via `prisma.vehicle.update`
- [ ] 2.7 Implementar `delete` — soft delete: `prisma.vehicle.update({ data: { deletedAt: new Date() } })`

## Detalhes de Implementação

```typescript
// src/infrastructure/database/repositories/prisma-vehicle.repository.ts

import { cuid } from "@/lib/cuid"; // ou importar de onde o projeto já usa
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import { VehicleName } from "@/domain/vehicle/value-objects/vehicle-name.vo";
import { Plate } from "@/domain/vehicle/value-objects/plate.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";

function toEntity(raw: Prisma.VehicleGetPayload<{}>): Vehicle {
  return Vehicle.rehydrate({
    id: raw.id,
    accountId: raw.accountId,
    name: VehicleName.create(raw.name),
    plate: raw.plate ? Plate.create(raw.plate) : null,
    brand: raw.brand ?? "",
    model: raw.model ?? "",
    color: raw.color ?? "",
    initOdometer: Odometer.create(raw.initOdometer),
    currentOdometer: Odometer.create(raw.currentOdometer),
    createdAt: raw.createdAt,
  });
}
```

**Atenção no `toEntity`:** `brand`, `model`, `color` são `String?` no schema mas `string` (não nullable) na entidade. Usar `?? ""` como fallback.

**`delete` é soft delete:**
```typescript
async delete(id: string): Promise<void> {
  await this._prisma.vehicle.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
```

**`findByAccount` com filtro e ordem:**
```typescript
async findByAccount(accountId: string): Promise<Vehicle[]> {
  const rows = await this._prisma.vehicle.findMany({
    where: { accountId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toEntity);
}
```

## Critérios de Sucesso

- Nenhum método lança `NotImplementedError`
- `findByAccount` não retorna veículos com `deletedAt` preenchido
- `delete` seta `deletedAt` sem remover o registro do banco
- TypeScript compila sem erros (`npx tsc --noEmit`)
- Nenhum teste existente quebra

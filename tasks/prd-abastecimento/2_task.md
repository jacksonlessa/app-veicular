---
status: completed
parallelizable: true
blocked_by: []
---

<task_context>
<domain>infra/database</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 2.0: Implementar `PrismaFuelupRepository` + teste de integração

## Visão Geral

O arquivo `src/infrastructure/database/repositories/prisma-fuelup.repository.ts` existe como stub: todos os 7 métodos lançam `NotImplementedError("Fase 4")`. Esta task substitui os stubs por implementações reais, incluindo mappers `toEntity`/`toPersistence`, e cobre o repositório com um teste de integração contra SQLite (mesma infra usada em `prisma-vehicle.repository.test.ts`).

<requirements>
- Implementar os 7 métodos de `FuelupRepository` no `PrismaFuelupRepository`
- Criar mappers puros `toEntity` e `toPersistence` (exportados) seguindo o padrão de `prisma-vehicle.repository.ts`
- Ordem canônica em `findByVehicle` e `findByVehiclePaginated`: `ORDER BY date ASC, odometer ASC, createdAt ASC`
- `findLastByVehicle` retorna o fuelup com maior `odometer` do veículo (não o mais recente por `date`) — é usado para validar monotonicidade do odômetro
- Integration test em `tests/integration/infrastructure/prisma-fuelup.repository.test.ts`
</requirements>

## Subtarefas

- [x] 2.1 Criar `toEntity(raw: PrismaFuelup): Fuelup` reusando os VOs (`FuelDate`, `Odometer`, `FuelAmount`, `FuelPrice`, `Kml`)
- [x] 2.2 Criar `toPersistence(fuelup: Fuelup): Prisma.FuelupCreateInput` desembrulhando VOs
- [x] 2.3 Implementar `findById`, `findByVehicle`, `findByVehiclePaginated`, `findLastByVehicle`, `create`, `update`, `delete`
- [x] 2.4 Criar `tests/integration/infrastructure/prisma-fuelup.repository.test.ts` cobrindo: inserção, listagem ordenada, paginação, `findLastByVehicle`, update (inclui `kmPerLiter` nullable), delete
- [x] 2.5 Rodar `npm test` e garantir verde

## Detalhes de Implementação

**Mapper `toEntity`:**

```ts
export function toEntity(raw: PrismaFuelup): Fuelup {
  return Fuelup.rehydrate({
    id: raw.id,
    vehicleId: raw.vehicleId,
    userId: raw.userId,
    date: FuelDate.create(raw.date),
    odometer: Odometer.create(raw.odometer),
    fuelType: raw.fuelType,
    fullTank: raw.fullTank,
    liters: FuelAmount.create(raw.liters),
    pricePerLiter: FuelPrice.create(raw.pricePerLiter),
    totalPrice: FuelPrice.create(raw.totalPrice),
    kmPerLiter: raw.kmPerLiter !== null ? Kml.create(raw.kmPerLiter) : null,
    createdAt: raw.createdAt,
  });
}
```

**`findByVehiclePaginated`:** retorna `{ items, total }` — usar `prisma.fuelup.findMany` + `prisma.fuelup.count` dentro de `prisma.$transaction([...])` para consistência.

**`findLastByVehicle`:** `findFirst({ where: { vehicleId }, orderBy: { odometer: "desc" } })`.

## Critérios de Sucesso

- Nenhum `NotImplementedError` restante em `prisma-fuelup.repository.ts`
- Integration test cobre todos os 7 métodos; testes verdes
- Ordenação canônica validada no teste (criar 3 fuelups em datas/odômetros diferentes e verificar ordem)
- `npm run lint` verde

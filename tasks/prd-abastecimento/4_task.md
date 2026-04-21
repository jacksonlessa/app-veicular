---
status: completed
parallelizable: true
blocked_by: ["1.0", "3.0"]
---

<task_context>
<domain>back/application</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 4.0: `RegisterFuelupUseCase` + testes unitários

## Visão Geral

Implementa o caso de uso de **criação** de abastecimento: valida ownership do veículo, aplica a regra dos 3 campos via `FuelupService.compute`, insere o novo fuelup na cadeia, recalcula a cadeia inteira via `recalculateChain` e persiste tudo atomicamente via `TransactionRunner.saveFuelup`.

<requirements>
- Arquivo: `src/application/usecases/fuelup/register-fuelup.usecase.ts`
- Valida que o veículo pertence à `accountId` da sessão (erro `vehicle.not_owned`)
- Valida que o odômetro é estritamente maior que `findLastByVehicle().odometer` (erro `odometer.not_increasing`) — respeita monotonicidade
- Aplica `FuelupService.compute` para a regra dos 3 campos (erros `fuelup.three_fields`, `fuelup.total_mismatch`)
- Recalcula km/l da cadeia inteira via `recalculateChain` (fonte de verdade — ignora o km/l retornado por `compute`)
- Grava tudo via `txRunner.saveFuelup({ mode: "create", ... })`
- Testes unitários com fakes em `tests/unit/application/usecases/fuelup/register-fuelup.usecase.test.ts`
</requirements>

## Subtarefas

- [x] 4.1 Criar tipos `RegisterFuelupInput` e `RegisterFuelupOutput`
- [x] 4.2 Assinar construtor: `(fuelupRepo, vehicleRepo, txRunner)`
- [x] 4.3 Fluxo do `execute`: ownership → load cadeia → compute → inserir na cadeia (ordem canônica) → `recalculateChain` → separar `upsert` vs `recomputed` → `txRunner.saveFuelup`
- [x] 4.4 Calcular `newCurrentOdometer = max(odometer dos fuelups)` (o `currentOdometer` do veículo nunca decresce)
- [x] 4.5 Escrever fakes: `FakeFuelupRepository`, `FakeVehicleRepository`, `FakeTransactionRunner`
- [x] 4.6 Cenários de teste: sucesso (primeiro abastecimento), sucesso (com anterior cheio calcula km/l), erro `vehicle.not_owned`, erro `vehicle.not_found`, erro `odometer.not_increasing`, erro `fuelup.three_fields`, erro `fuelup.total_mismatch`
- [x] 4.7 `npm test` verde

## Detalhes de Implementação

```ts
async execute(input: RegisterFuelupInput): Promise<RegisterFuelupOutput> {
  const vehicle = await this.vehicles.findById(input.vehicleId);
  if (!vehicle) throw new BusinessRuleError("vehicle.not_found");
  if (vehicle.accountId !== input.accountId)
    throw new BusinessRuleError("vehicle.not_owned");

  const last = await this.fuelups.findLastByVehicle(input.vehicleId);
  if (last && input.odometer <= last.odometer.value)
    throw new BusinessRuleError("odometer.not_increasing");

  // 1. Compute regra dos 3 campos (valida e retorna litros/ppl/total)
  const computed = FuelupService.compute({ ... });

  // 2. Construir nova entity
  const newFuelup = Fuelup.create({ id: randomUUID(), ... });

  // 3. Carregar cadeia existente + inserir novo → ordenar canonicamente → recalcular
  const chain = [...(await this.fuelups.findByVehicle(input.vehicleId)), newFuelup]
    .sort(byCanonicalOrder);
  const recomputed = recalculateChain(chain);

  // 4. Separar o upsert do resto
  const upserted = recomputed.find((f) => f.id === newFuelup.id)!;
  const others = recomputed.filter((f) => f.id !== newFuelup.id);
  const newOdometer = Math.max(...recomputed.map((f) => f.odometer.value));

  // 5. Persistir atomicamente
  await this.txRunner.saveFuelup({
    mode: "create",
    fuelup: toPersistenceShape(upserted),
    recomputed: others.map((f) => ({ id: f.id, kmPerLiter: f.kmPerLiter?.value ?? null })),
    vehicleId: vehicle.id,
    newCurrentOdometer: newOdometer,
  });

  return { fuelupId: newFuelup.id };
}
```

**`byCanonicalOrder`:** `date ASC, odometer ASC, createdAt ASC` — extrair para helper compartilhado em `_shared/order.ts` se outros use cases reusarem.

## Critérios de Sucesso

- Use case cobre todos os 7 cenários de teste sem mocks de repositórios
- km/l calculado via `recalculateChain` (fonte de verdade) bate com a fórmula manual no teste
- `vehicle.currentOdometer` enviado ao `TransactionRunner` é sempre o maior da cadeia
- `npm test` verde; `npm run lint` verde

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

# Tarefa 5.0: `UpdateFuelupUseCase` + `DeleteFuelupUseCase` + testes unitários

## Visão Geral

Implementa os casos de uso de **edição** e **exclusão** de abastecimento, ambos com recálculo em cascata dos km/l posteriores e atualização do `vehicle.currentOdometer`. Reusa o helper `recalculateChain` (task 3.0) e o `TransactionRunner.saveFuelup` / `deleteFuelup` (task 1.0).

<requirements>
- Arquivos: `update-fuelup.usecase.ts` e `delete-fuelup.usecase.ts` em `src/application/usecases/fuelup/`
- `Update` aplica novamente `FuelupService.compute` se algum dos 3 campos monetários mudou, e valida monotonicidade do odômetro (considerando que ele pode ter mudado)
- `Delete` é simples: remove o fuelup da cadeia e recalcula tudo
- Ambos validam ownership do veículo via `accountId` da sessão
- `newCurrentOdometer` = maior odômetro restante na cadeia; se cadeia ficar vazia, usar `vehicle.initOdometer`
- Testes unitários cobrindo sucessos e erros principais
</requirements>

## Subtarefas

- [x] 5.1 Criar `UpdateFuelupUseCase` com fluxo: load fuelup → ownership → validar nova monotonicidade → compute (se mudou) → substituir na cadeia → `recalculateChain` → `txRunner.saveFuelup({ mode: "update" })`
- [x] 5.2 Criar `DeleteFuelupUseCase` com fluxo: load fuelup → ownership → remover da cadeia → `recalculateChain` → `txRunner.deleteFuelup`
- [x] 5.3 Helper compartilhado `computeNewOdometer(chain, vehicle)`: se cadeia vazia, retorna `vehicle.initOdometer`; senão, retorna `max`
- [x] 5.4 Testes `update-fuelup.usecase.test.ts`: sucesso, edição retroativa invalida km/l posteriores, mudança de odômetro quebra monotonicidade → erro, mudança de `fullTank: true → false` recalcula
- [x] 5.5 Testes `delete-fuelup.usecase.test.ts`: sucesso (cadeia maior), exclusão do primeiro cheio zera km/l do segundo, exclusão do único fuelup reseta `currentOdometer` para `initOdometer`
- [x] 5.6 `npm test` verde

## Detalhes de Implementação

**Monotonicidade no UPDATE:** ao mudar o odômetro de um fuelup, o novo valor deve ser `> odômetro do fuelup imediatamente anterior na ordem canônica` e `< odômetro do fuelup imediatamente posterior` (se houver). Validar após ordenar.

**Eficácia da cascata:** o teste deve provar que um fuelup editado N posições atrás realmente dispara `update` em todos os posteriores. Usar um `FakeTransactionRunner` que grava `lastSaveData` / `lastDeleteData` e assertar o tamanho de `recomputed`.

**Códigos de erro:**
- `fuelup.not_found`
- `vehicle.not_owned`
- `odometer.not_increasing` (se, após a edição, a cadeia deixar de ser monotônica)
- `fuelup.three_fields`, `fuelup.total_mismatch` (herdados do `FuelupService.compute`)

## Critérios de Sucesso

- Os dois use cases cobrem todos os cenários listados sem mocks de repositórios
- `recalculateChain` é invocado em ambos; testes verificam `lastSaveData.recomputed`/`lastDeleteData.recomputed`
- `npm test` verde; `npm run lint` verde

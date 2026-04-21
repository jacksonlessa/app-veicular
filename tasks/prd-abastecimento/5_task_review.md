# Task 5.0 Review — UpdateFuelupUseCase + DeleteFuelupUseCase + testes unitários

## Verdict: APPROVED

## Findings

### Critical
Nenhum.

### High
Nenhum.

### Medium
- **Divergência nomenclatura TechSpec vs implementação (não bloqueante):** A TechSpec descreve o campo do `SaveFuelupData` como `upsert: Fuelup`, mas o port real usa `fuelup: {...}` com discriminador `mode: "create" | "update"`. Essa decisão foi tomada na task 1.0 e o use case de update está alinhado com o padrão já estabelecido — não é uma regressão desta task. Registrar como débito de documentação.

### Low
- **Código duplicado de Fakes nos testes:** `FakeFuelupRepository`, `FakeVehicleRepository` e `FakeTransactionRunner` são redefinidos integralmente em `update-fuelup.usecase.test.ts`, `delete-fuelup.usecase.test.ts` e `register-fuelup.usecase.test.ts`. Extrair para um módulo compartilhado `tests/unit/application/usecases/fuelup/_fakes.ts` eliminaria ~250 linhas duplicadas. Não bloqueia aprovação.
- **Warnings de lint em parâmetros prefixados com `_`:** `_data` nos métodos `createAccountWithOwner` / `acceptInvite` do `FakeTransactionRunner` geram warnings `@typescript-eslint/no-unused-vars`. Padrão pré-existente no projeto; não gerado por esta task.

## Summary

Todos os subtasks (5.1–5.6) estão implementados e corretos:

- `UpdateFuelupUseCase`: aplica `FuelupService.compute` apenas quando campo monetário muda, valida monotonicidade do odômetro após reordenação canônica, chama `recalculateChain` e delega para `txRunner.saveFuelup({ mode: "update" })`.
- `DeleteFuelupUseCase`: remove o fuelup da cadeia, recalcula e delega para `txRunner.deleteFuelup`.
- `computeNewOdometer`: helper puro com fallback para `vehicle.initOdometer` quando cadeia fica vazia.
- Testes unitários cobrem: sucesso simples, edição retroativa (verifica tamanho de `recomputed`), mudança de `fullTank true→false`, `fuelup.not_found`, `vehicle.not_owned`, `odometer.not_increasing` (dois casos) e `fuelup.three_fields`.
- `DeleteFuelupUseCase` testa: cadeia com 3 fuelups, exclusão do primeiro tanque cheio zera km/l do segundo, exclusão do único fuelup reseta `currentOdometer` para `initOdometer`.
- `npm test` verde (13/13 testes passam). `npm run lint` verde (0 erros).
- Clean Architecture respeitada: use cases dependem apenas de ports, sem Prisma direto.
- Ownership validada via `accountId` em ambos os use cases.

## Required Actions Before Completion
Nenhuma ação obrigatória. Os itens Medium e Low são melhorias opcionais para tasks futuras.

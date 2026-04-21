# Task 4.0 Review — `RegisterFuelupUseCase` + testes unitários

## Verdict: CHANGES REQUIRED

## Findings

### Critical

Nenhum.

### High

**H1 — Cenário 7 (`fuelup.total_mismatch`) não testa o erro esperado**

O `describe("erro: fuelup.total_mismatch")` executa um happy path e contém um comentário interno admitindo que o erro não consegue ser disparado pelo use case. A tarefa exige explicitamente a cobertura desse cenário de erro (subtarefa 4.6: "erro `fuelup.total_mismatch`"). O teste marcado como "erro" passa um input coerente (`pricePerLiter=5, totalPrice=200`) e verifica o sucesso, mascarando a ausência de cobertura.

`FuelupService.compute` sempre deriva o terceiro campo de forma consistente, portanto o `total_mismatch` — lançado por `Fuelup.create` quando `|totalPrice - liters * pricePerLiter| > tolerância` — realmente não é alcançável pelo fluxo normal do use case. Isso significa que ou: (a) o teste deve ser reescrito reconhecendo que `total_mismatch` é invariant do domínio e não testável via use case (com nome de describe corrigido), ou (b) a tarefa precisa documentar explicitamente que esse código de erro é coberto na camada de entidade (`Fuelup` entity tests) e não nos testes do use case.

**Ação requerida:** Renomear o describe/test para refletir o happy path (`pricePerLiter + totalPrice como dois campos fornecidos → computa liters corretamente`) e adicionar um teste ou comentário documentado mostrando onde `fuelup.total_mismatch` é coberto (unit test da entidade). O critério de sucesso da tarefa afirma que todos os 7 cenários devem ser cobertos sem ambiguidade.

### Medium

**M1 — Divergência de assinatura entre TechSpec e implementação do `TransactionRunner.saveFuelup`**

A TechSpec (seção "Interfaces Principais") define:
```ts
saveFuelup(data: {
  upsert: Fuelup;          // domain entity
  recomputed: Fuelup[];    // domain entities
  vehicleId: string;
  newCurrentOdometer: number;
}): Promise<void>;
```
A implementação real usa:
```ts
saveFuelup(data: SaveFuelupData): Promise<void>;
// onde SaveFuelupData tem: mode, fuelup (DTO plano), recomputed (Array<{id, kmPerLiter}>)
```
A implementação é arquiteturalmente superior (não vaza entidade de domínio através do port), mas representa uma divergência explícita da TechSpec aprovada. A TechSpec deve ser atualizada para refletir o contrato real.

**M2 — `odometer.not_increasing` usa `findLastByVehicle` (último canônico), não o maior odômetro absoluto**

A validação checa `input.odometer <= last.odometer.value` onde `last` é o último na ordem canônica (`date ASC, odometer ASC, createdAt ASC`). Se um usuário registrar um abastecimento com data retroativa (data < data do último), o último canônico não será o de maior odômetro. Um fuelup com data mais antiga mas odômetro maior poderia ser inserido "antes" na cadeia canônica violando a monotonicidade em relação a fuelups posteriores.

Para o MVP (uso normal sequencial), isso é aceitável, mas vale documentar como débito técnico. Nenhuma ação bloqueante necessária, mas deve ser registrado.

### Low

**L1 — `recalculateChain` acumula liters de partials antes do primeiro fullTank sem descartá-los explicitamente**

Quando os primeiros fuelups são parciais (`fullTank=false`) e não há `lastFullTank` ainda, `litersAccumulated` cresce mas nunca é usado para calcular km/l (pois `lastFullTank === null`). Ao processar o primeiro `fullTank`, `kml` permanece `null` e o acumulador é zerado — comportamento correto. No entanto, não há comentário documentando essa intenção, deixando o código suscetível a mal-entendidos em futuras modificações.

**L2 — Fakes duplicados sem extração para módulo compartilhado**

`FakeFuelupRepository`, `FakeVehicleRepository` e `FakeTransactionRunner` em `register-fuelup.usecase.test.ts` serão copiados em `update-fuelup.usecase.test.ts` e `delete-fuelup.usecase.test.ts` (tasks futuras). A TechSpec menciona que fakes devem seguir o padrão de `tests/unit/application/usecases/account/`. Extrair para `tests/unit/application/usecases/fuelup/_fakes/` desde já evita divergência entre cópias.

## Summary

A implementação do `RegisterFuelupUseCase` é sólida: o fluxo principal (ownership check → monotonicidade → compute → recalculateChain → saveFuelup atômico) está correto e alinhado com o PRD e a TechSpec. Os helpers `recalculateChain` e `byCanonicalOrder` estão bem estruturados. Os testes dos cenários 1–6 exercem os erros esperados de forma adequada.

O único bloqueio para aprovação é **H1**: o cenário 7 (`fuelup.total_mismatch`) não testa o erro que promete testar — o critério de sucesso da tarefa exige cobertura dos 7 cenários de erro e esse está disfarçado como happy path. A correção pode ser simples (renomear o teste + documentar onde o erro é realmente coberto), mas precisa acontecer antes de marcar a tarefa como concluída.

## Required Actions Before Completion

1. **(H1 — bloqueante)** Corrigir o describe/test do cenário 7: ou demonstrar como `fuelup.total_mismatch` é testável pelo use case, ou renomear o teste para happy path e referenciar o teste de entidade que cobre esse erro. O critério de sucesso ("Use case cobre todos os 7 cenários de teste") deve ser satisfeito sem ambiguidade.

2. **(M1 — recomendado)** Atualizar a TechSpec (`techspec.md`, seção "Interfaces Principais") para refletir o contrato real do `SaveFuelupData` com `mode`, `fuelup` (DTO plano) e `recomputed` (array de `{ id, kmPerLiter }`), eliminando a referência a `upsert: Fuelup`.

3. **(L2 — recomendado)** Extrair os fakes para `tests/unit/application/usecases/fuelup/_fakes/index.ts` para reutilização nas próximas tasks (update, delete).

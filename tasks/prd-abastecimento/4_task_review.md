# Task 4.0 Review — `RegisterFuelupUseCase` + testes unitários

## Verdict: APPROVED

> Re-review após fix commit 386b955. Review anterior: CHANGES REQUIRED.

## Findings

### Critical

Nenhum.

### High

Nenhum.

> **H1 resolvido.** O `describe` do cenário 7 foi renomeado para `"sucesso: dois campos fornecidos → terceiro campo derivado corretamente"` e o comentário interno documenta explicitamente que `fuelup.total_mismatch` não é alcançável pelo fluxo normal do use case (porque `FuelupService.compute` sempre deriva o terceiro campo de forma coerente) e que a cobertura desse código de erro está em `tests/unit/domain/fuel/fuelup.entity.test.ts` (linha 112). O teste da entidade existe e exercita o erro conforme esperado.

### Medium

**M1 — Divergência de assinatura entre TechSpec e implementação do `TransactionRunner.saveFuelup`** *(mantido da review anterior — não bloqueante)*

A TechSpec define `saveFuelup(data: { upsert: Fuelup; recomputed: Fuelup[]; ... })` mas a implementação usa `SaveFuelupData` com `mode`, `fuelup` (DTO plano) e `recomputed` (array de `{ id, kmPerLiter }`). A divergência é arquiteturalmente justificada (não vaza entidade de domínio através do port) mas a TechSpec não foi atualizada.

**M2 — `odometer.not_increasing` usa `findLastByVehicle` (último canônico), não o maior odômetro absoluto** *(mantido da review anterior — não bloqueante)*

Para o MVP (uso sequencial normal) o comportamento é aceitável. Registrado como débito técnico.

### Low

**L1 — `recalculateChain`: falta comentário sobre parciais antes do primeiro fullTank** *(mantido da review anterior)*

Quando os primeiros fuelups são parciais e não há `lastFullTank`, `litersAccumulated` cresce mas nunca é consumido até o primeiro `fullTank`. Comportamento correto, mas sem comentário documentando a intenção.

> **L2 resolvido.** Os fakes foram extraídos para `tests/unit/application/usecases/fuelup/_fakes/index.ts` e o arquivo de teste agora importa de lá. O módulo expõe `FakeFuelupRepository`, `FakeVehicleRepository` e `FakeTransactionRunner` com implementações completas (incluindo `deleteFuelup`), prontos para reutilização em `update-fuelup` e `delete-fuelup` (já em uso nesses arquivos).

## Summary

As duas correções exigidas na review anterior foram aplicadas corretamente:

1. O cenário 7 foi renomeado de `"erro: fuelup.total_mismatch"` para `"sucesso: dois campos fornecidos → terceiro campo derivado corretamente"`, eliminando a ambiguidade que mascarava a ausência de cobertura. O comentário interno referencia o teste de entidade onde `total_mismatch` é de fato coberto (`tests/unit/domain/fuel/fuelup.entity.test.ts:112`).

2. Os fakes foram extraídos para `tests/unit/application/usecases/fuelup/_fakes/index.ts` e o arquivo principal importa desse módulo compartilhado.

A implementação do `RegisterFuelupUseCase` está sólida, os 7 cenários de teste estão cobertos sem ambiguidade, e os critérios de sucesso da tarefa são satisfeitos.

## Required Actions Before Completion

Nenhuma ação bloqueante. As pendências M1, M2 e L1 são débitos técnicos de baixa prioridade que podem ser endereçados em tasks futuras ou de manutenção.

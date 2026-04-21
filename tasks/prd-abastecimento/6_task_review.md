# Task 6.0 Review — `ListFuelupsUseCase` + `GetFuelupUseCase` + testes unitários

## Verdict: APPROVED

## Findings

### Critical
Nenhum.

### High
Nenhum.

### Medium

**M1 — `toDto` duplicada entre os dois use cases**
A função `toDto(fuelup: Fuelup): FuelupListItemDto` é definida de forma idêntica em `list-fuelups.usecase.ts` (linha 19) e `get-fuelup.usecase.ts` (linha 14). A TechSpec menciona um módulo `_shared/` (onde já existe `recalculate-chain.ts`); essa função deveria ser exportada de lá. A duplicação não causa bug agora, mas qualquer alteração futura no shape do DTO exigirá alteração em dois lugares.

### Low

**L1 — `vehicle.not_found` não lançado no caminho de veículo inexistente em `GetFuelupUseCase`**
Quando `vehicles.findById` retorna `null` (veículo não existe), o use case lança `vehicle.not_owned` (linha 39: `if (!vehicle || vehicle.accountId !== input.accountId)`). Isso está alinhado à task ("404 quando não encontrado ou não é da conta") e ao comportamento do PRD (RF-20: retornar 404/403 para recursos fora da conta), mas difere ligeiramente do padrão estabelecido no `ListFuelupsUseCase` onde a ausência do veículo levanta `vehicle.not_found`. A inconsistência não gera bug para o consumidor HTTP (ambos serão mapeados para 404/403), porém dificulta logging e debug. Considerar unificar em `vehicle.not_found` quando `null` e `vehicle.not_owned` quando `accountId` não bate.

**L2 — Warnings de lint pré-existentes sem relação com esta task**
`npm run lint` retorna 15 warnings (0 errors), todos em arquivos anteriores a esta task. Nenhum novo warning foi introduzido pela implementação da task 6.0.

## Summary

A implementação atende a todos os requisitos da task: os dois use cases existem nos caminhos corretos, respeitam ownership via `accountId`, retornam DTOs desembrulhados, suportam paginação com defaults corretos (`page=1`, `pageSize=20`), não escrevem no DB e não usam `TransactionRunner`. Os 10 testes cobrem happy path, paginação explícita, `vehicle.not_found`, `vehicle.not_owned` e `fuelup.not_found`. `npm test` e `npm run lint` passam sem novos erros. A única ressalva relevante (M1) é duplicação de código que não impede aprovação, mas deve ser resolvida antes da entrega final da feature ou na task seguinte que tocar o módulo `_shared/`.

## Required Actions Before Completion

Nenhuma ação bloqueante. As issues M1 e L1 são recomendações de qualidade que podem ser endereçadas em tarefa de refatoração futura sem risco de regressão.

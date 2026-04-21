# Task 1.0 Review — Estender `TransactionRunner` com `saveMaintenance` e `deleteMaintenance`

## Verdict: APPROVED

## Findings

### Critical
Nenhum.

### High
Nenhum.

### Medium

**[M1] `deleteMaintenance` exige `newCurrentOdometer !== undefined` além de `recalculateOdometer === true`**

Arquivo: `src/infrastructure/database/prisma-transaction-runner.ts`, linha 118.

```ts
if (data.recalculateOdometer && data.newCurrentOdometer !== undefined) {
```

O requisito da task diz: "atualiza `vehicle.currentOdometer` apenas se `recalculateOdometer === true`". O type de `DeleteMaintenanceData` declara `newCurrentOdometer?: number`, então a guarda dupla é defensiva. No entanto, se o chamador passar `recalculateOdometer: true` sem `newCurrentOdometer`, a atualização de odômetro será silenciosamente ignorada — comportamento inesperado. Deve-se ou tornar `newCurrentOdometer` obrigatório quando `recalculateOdometer` é `true` (via overload ou type refinement), ou lançar erro se a combinação for inválida.

**[M2] Implementação usa `create`/`update` explícito em vez de `upsert` (divergência do techspec)**

O techspec descreve `upsert` no pseudocódigo de `saveMaintenance`. A implementação usa branching explícito `create` / `update`. Isso é funcionalmente equivalente, mas diverge do contrato documentado. A diferença é inofensiva para esta task, mas pode confundir desenvolvedores que consultarem o techspec.

### Low

**[L1] Lint warnings em parâmetros `_id` nos mappers de items**

`src/infrastructure/database/prisma-transaction-runner.ts`, linhas 94 e 102: `'_id' is defined but never used`. O prefixo `_` suprime a maioria dos linters mas o setup atual ainda emite warning. Não é erro, apenas ruído de lint.

**[L2] Failing tests pertencem a worktree separado (`.claude/worktrees/agent-a600c605/`)**

`npm test` reporta 5 falhas em `error-handler.test.ts` dentro de `.claude/worktrees/agent-a600c605/`. Essas falhas são de outro agente/worktree e pré-existiam à task 1. Os 901 testes do codebase principal passam. Recomenda-se excluir o diretório `.claude/worktrees/` da configuração do test runner (vitest config `exclude`) para evitar confusão no futuro.

## Summary

A implementação da task 1.0 está correta e completa. Os dois tipos (`SaveMaintenanceData`, `DeleteMaintenanceData`) foram adicionados com as assinaturas exatas especificadas na task. A interface `TransactionRunner` exporta exatamente os 6 métodos sem TODOs. O `PrismaTransactionRunner` implementa ambos os novos métodos usando `prisma.$transaction`, com `deleteMany` dos itens antes do `update` (modo update), e atualização condicional do odômetro. Todos os `FakeTransactionRunner` nos 3 arquivos de teste afetados foram atualizados com stubs `throw new Error("not expected")`. As assinaturas de `saveFuelup`, `deleteFuelup`, `createAccountWithOwner` e `acceptInvite` estão intactas.

Os problemas encontrados são de severidade média/baixa e não bloqueiam o funcionamento: a guarda dupla em `deleteMaintenance` é defensiva porém pode mascarar bug do chamador, e a divergência do `upsert` é apenas documental.

## Required Actions Before Completion

Nenhuma ação bloqueante. As issues M1 e M2 são recomendadas para endereçar em task futura ou revisão do techspec.

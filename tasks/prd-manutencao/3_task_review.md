# Task 3.0 Review — Domain: Value Objects, Entidades e Interface do Repositório

## Verdict: CHANGES REQUIRED

## Findings

### Critical

**C-1 — `ItemPrice` aceita valor 0 (violação da regra de negócio)**

- Arquivo: `src/domain/maintenance/value-objects/item-price.vo.ts`, linha 10
- Condição implementada: `input < 0` (rejeita apenas negativos)
- Condição exigida pela task, PRD (RF-01) e TechSpec: `input <= 0` (rejeita zero e negativos)
- O teste `item-price.vo.test.ts` corrobora o bug: o caso "accepts zero (free item)" valida explicitamente que `ItemPrice.create(0)` é aceito, contradizendo o requisito.
- Consequência: um item com valor unitário 0 seria salvo sem erro, corrompendo o `totalPrice` da manutenção.

**C-2 — `Maintenance.create()` recebe `odometer` e `location` como campos obrigatórios sem `maintenanceId` na `MaintenanceItem`**

- O `MaintenanceItem` não expõe `maintenanceId` (que consta no TechSpec como campo da entidade). A entidade armazena apenas `id`, `description`, `quantity`, `unitPrice`. Isso não é bloqueante para a Tarefa 3, mas a ausência quebrará a camada de infraestrutura na Tarefa seguinte quando o repositório precisar persistir o vínculo `maintenanceId → maintenanceItem`.

  > Severidade rebaixada para High porque a Tarefa 3 não cobre infraestrutura, mas deve ser corrigido antes de avançar.

### High

**H-1 — `MaintenanceItem` não tem `maintenanceId`**

- TechSpec define: `MaintenanceItem { id, maintenanceId, description, quantity, unitPrice, subtotal }`.
- A implementação omite `maintenanceId`. O repositório Prisma precisará desse campo para associar itens ao registro pai.
- Correção: adicionar `maintenanceId` ao `MaintenanceItemProps` e ao `create()`/`rehydrate()`.

**H-2 — `Maintenance` expõe `odometer` e `location` como obrigatórios, mas TechSpec define ambos como opcionais**

- TechSpec: `odometer?: Odometer`, `description?: string` (mapeado de `location`).
- `MaintenanceProps` declara `odometer: Odometer` e `location: string` sem `?`. Isso força quem chama `Maintenance.create()` ou `rehydrate()` a sempre fornecer odômetro e localização, quebrando o requisito de campos opcionais do PRD (RF-01) e da TechSpec.

**H-3 — `ItemQuantity` e `ItemPrice` não têm `rehydrate()`**

- TechSpec e padrão do projeto (ver `MaintenanceDate`) exigem `rehydrate()` nos VOs para que o repositório possa reconstituir entidades sem revalidação.
- `ItemQuantity` e `ItemPrice` não expõem esse método. O repositório Prisma precisará de `rehydrate()` para ambos.

### Medium

**M-1 — `MaintenanceRepository` inclui `create`, `update`, `delete` e `findByUser`, que contradizem o TechSpec**

- TechSpec especifica explicitamente que a interface deve ter apenas `findById` e `findByVehicleId`; operações de escrita são geridas exclusivamente via `PrismaTransactionRunner.saveMaintenance()` / `deleteMaintenance()`.
- A interface implementada adiciona `create`, `update`, `delete` e `findByUser`. Esses métodos não têm implementação prevista no TechSpec e expõem uma superfície de API inconsistente com a estratégia de atomicidade escolhida.

**M-2 — Testes de `ItemPrice` validam o comportamento errado (zero aceito)**

- O teste `item-price.vo.test.ts` testa e aprova `ItemPrice.create(0)`, alinhando-se à implementação bugada em vez do requisito. Deve ser corrigido junto com C-1.

### Low

**L-1 — `ItemQuantity` e `ItemPrice` não têm `rehydrate()` no módulo de testes**

- Os testes cobrem os casos de borda exigidos pela task, mas não testam `rehydrate()` (que ainda não existe — ver H-3).

**L-2 — `MaintenanceDate.create()` aceita `string` além de `Date`**

- O TechSpec e a assinatura da task definem `create(raw: Date)`. A implementação aceita `Date | string`. Essa flexibilidade extra não é problemática em runtime, mas diverge do contrato e pode mascarar erros de tipo nos chamadores.

## Summary

A implementação cobre a estrutura geral corretamente: os arquivos existem, `create()` e `rehydrate()` estão presentes na maioria dos artefatos, testes unitários existem e passam (57/57). Entretanto, há uma violação crítica da regra de negócio (`ItemPrice` aceita 0), dois problemas de alta severidade que quebrarão tarefas subsequentes (`maintenanceId` ausente no item; `odometer`/`location` obrigatórios quando deveriam ser opcionais), e um desvio médio na interface do repositório.

## Required Actions Before Completion

1. **[C-1]** Corrigir `ItemPrice.create()`: mudar `input < 0` para `input <= 0`. Atualizar o teste correspondente para esperar erro em `create(0)`.
2. **[H-1]** Adicionar `maintenanceId: string` ao `MaintenanceItemProps` e aos métodos `create()` e `rehydrate()` de `MaintenanceItem`.
3. **[H-2]** Tornar `odometer` e `location`/`description` opcionais em `MaintenanceProps` e em `Maintenance.create()`.
4. **[H-3]** Adicionar `static rehydrate(value: number): ItemQuantity` a `ItemQuantity` e `static rehydrate(value: number): ItemPrice` a `ItemPrice`.
5. **[M-1]** Remover `create`, `update`, `delete` e `findByUser` da interface `MaintenanceRepository`, deixando apenas `findById` e `findByVehicleId`, conforme o TechSpec.
6. Rodar `npm test` e `npm run lint` verdes após as correções.

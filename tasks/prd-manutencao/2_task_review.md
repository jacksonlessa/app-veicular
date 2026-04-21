# Task 2.0 Review — Implementar `PrismaMaintenanceRepository`

## Verdict: CHANGES REQUIRED

## Findings

### Critical

**C1 — `Odometer.create(null)` lança exceção em tempo de execução**

`raw.odometer` é `Int?` no schema Prisma (pode ser `null`). `Odometer.create` aceita somente `number` e valida `Number.isInteger(input) && input >= 0` — `Number.isInteger(null)` é `false`, portanto lança `InvalidValueError` para qualquer manutenção sem odômetro.

Arquivo: `src/infrastructure/database/repositories/prisma-maintenance.repository.ts`, linha 84:
```ts
odometer: Odometer.create(raw.odometer),   // explode quando raw.odometer é null
```

O campo `odometer` em `MaintenanceProps` é `odometer: Odometer` (obrigatório), mas o techspec define-o como opcional (`readonly odometer?: Odometer`). Há divergência entre a entidade implementada (Fase 1) e o techspec. O repositório deve tratar o caso `null` mas não pode sem que a entidade aceite `Odometer | undefined`. Este é o defeito de maior impacto — qualquer `findById` ou `findByVehicle` para manutenção sem odômetro quebrará em produção.

**Ação:** corrigir `Odometer.create` para aceitar `number | null | undefined` e retornar `undefined`, ou ajustar `MaintenanceProps` para `odometer?: Odometer` e guardar `raw.odometer != null ? Odometer.create(raw.odometer) : undefined` no mapper.

---

### High

**H1 — Mapeamento `location → description` diverge do techspec e task**

O techspec define a entidade com `readonly description?: string` (mapeado de `location`). A entidade implementada na Fase 1 usa `location: string` (obrigatório, sem alias). O repositório passa `location: raw.location ?? ""` — correto para a entidade existente, mas:

- O campo `null` do banco é mapeado para `""` (string vazia) em vez de `undefined` ou `null`. A task diz: `raw.location ?? undefined`. A entidade requer `string`, então `undefined` quebraria a tipagem — a inconsistência vem da entidade, não do repositório.
- Os testes verificam `result!.location` (linha 127), acoplando-se ao campo `location` em vez de `description`, o que contraria o contrato do techspec.

**Ação:** alinhar a entidade `Maintenance` ao techspec (renomear `location → description`, tornar opcional) **ou** atualizar o techspec/task para refletir que o campo permanece `location: string` na entidade. O repositório deve seguir após essa decisão.

**H2 — `MaintenanceItem.rehydrate` não persiste `subtotal` do banco**

O repositório ignora `item.subtotal` armazenado no banco:
```ts
MaintenanceItem.rehydrate({
  id: item.id,
  description: item.description,
  quantity: ItemQuantity.create(item.quantity),
  unitPrice: ItemPrice.create(item.unitPrice),
  // subtotal omitido — recalculado via quantity * unitPrice
})
```
A entidade calcula `subtotal` dinamicamente como `quantity.value * unitPrice.value`. Isso é funcionalmente correto somente se `subtotal` no banco sempre for `quantity × unitPrice`. Se houver descontos ou arredondamentos futuros, o valor armazenado seria ignorado. O task spec especifica explicitamente que `subtotal` deve ser mapeado via `rehydrate`. A `MaintenanceItemProps` atual não inclui `subtotal` nem `maintenanceId` — divergência em relação ao pseudocódigo da task (que inclui ambos).

**Ação:** avaliar se `MaintenanceItemProps` deve incluir `subtotal` persistido. Se não, documentar a decisão. Atualmente é um risco silencioso.

---

### Medium

**M1 — Teste verifica campo `location` diretamente (linha 127), não `description`**

```ts
expect(result!.location).toBe("Revisão geral");
```

Se a entidade for corrigida para usar `description` (alinhando com techspec), este teste quebrará sem aviso claro. O teste está acoplado à implementação atual da entidade, não ao contrato do techspec.

**M2 — Teste de `null location` mapeia para `""` e não para `undefined`**

Linha 174: `expect(result!.location).toBe("")`. A task especifica `raw.location ?? undefined` (nulo → `undefined`). O teste valida o comportamento atual (`""`), que existe porque a entidade obriga `location: string`. Este comportamento deve ser explicitamente documentado ou corrigido conforme decisão sobre H1.

**M3 — Caminho do arquivo de teste diverge da task**

Task especifica: `src/__tests__/integration/prisma-maintenance.repository.test.ts`
Implementado em: `tests/integration/infrastructure/prisma-maintenance.repository.test.ts`

Se a convenção do projeto usa `tests/`, o caminho implementado pode ser correto — mas é necessário confirmar e atualizar a task para evitar confusão.

---

### Low

**L1 — `NotImplementedError` em `create`, `update`, `delete`**

Aceitável dado o escopo da task (escrita via `TransactionRunner`). A abordagem é consistente com o padrão do projeto. Sem ação necessária.

**L2 — Subtarefas não marcadas como concluídas**

O arquivo `2_task.md` mantém todas as subtarefas com `[ ]` (não marcadas). Isso impedirá que o pipeline marque a task como concluída corretamente.

---

## Summary

A implementação cobre corretamente `findById` com `include: { items: true }`, retorno `null` quando não encontrado, `findByVehicle` com `orderBy: { date: "desc" }` e inclusão de itens, e testes de integração com cobertura razoável dos cenários principais.

No entanto, há dois problemas bloqueantes:

1. **`Odometer.create(null)` quebrará em runtime** para qualquer manutenção sem odômetro — defeito crítico que afeta a funcionalidade básica de listagem e consulta.
2. **Divergência entre entidade implementada e techspec** no campo `location` vs `description` e na opcionalidade do campo — requer decisão arquitetural e alinhamento antes de avançar para as camadas de Application e API.

O repositório em si está bem estruturado, com tipo auxiliar `PrismaMaintenanceWithItems`, constante `include` reutilizada, e implementação limpa de `toEntity`. Os defeitos são herdados da entidade da Fase 1 que não seguiu integralmente o techspec.

---

## Required Actions Before Completion

1. **[CRITICAL]** Corrigir o tratamento de `raw.odometer === null` no mapper `toEntity`. Opções: (a) ajustar `Odometer.create` para aceitar `number | null` retornando instância com 0 ou lançando apenas para negativos; ou (b) tornar `odometer` opcional na entidade e no mapper — `raw.odometer != null ? Odometer.create(raw.odometer) : undefined`.

2. **[HIGH]** Tomar decisão arquitetural sobre `location` vs `description`: manter `location` na entidade (aceitando desvio do techspec) **ou** renomear para `description` e tornar opcional. Atualizar repositório, testes e techspec conforme a decisão.

3. **[HIGH]** Se `MaintenanceItem` dever persistir `subtotal`, adicionar o campo a `MaintenanceItemProps` e ao `rehydrate`. Se subtotal calculado for intencional, documentar explicitamente.

4. **[MEDIUM]** Atualizar testes para usar o campo correto após resolução de H1.

5. **[LOW]** Confirmar caminho do arquivo de teste e atualizar a task se necessário.

6. **[LOW]** Marcar subtarefas 2.1–2.5 como concluídas no arquivo `2_task.md` após correções.

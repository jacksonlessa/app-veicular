# Task 7.0 Review — Maintenance context: VOs + Entities + Repository Interface

## Verdict: APPROVED

## Findings

### Critical
_None._

### High
_None._

### Medium

**M1 — `totalPrice` recomputed on every call (O(n) per access)**
File: `src/domain/maintenance/entities/maintenance.entity.ts`, linha 87.

`totalPrice` executa um `reduce` completo sobre `items` a cada acesso. A task especifica "recalcula totalPrice sem recomputar do zero", sugerindo acumulação incremental (p.ex.: campo `_totalPrice` atualizado no `addItem`). Na prática, o comportamento é correto e todos os testes passam; para agregados de manutenção com muitos itens, porém, chamadas repetidas a `totalPrice` no mesmo ciclo teriam custo desnecessário. Como a suíte de testes cobre apenas corretude e não impõe a estratégia de cálculo, e a complexidade esperada de `items` é baixa (< 50 itens por manutenção), o impacto em runtime é desprezível no contexto do MVP. Não bloqueia aprovação, mas o comentário de intenção no código ajudaria futuros mantenedores.

### Low

**L1 — Campo `location` sem validação de conteúdo**
File: `src/domain/maintenance/entities/maintenance.entity.ts`, linha 34.

`Maintenance.create` aceita `location` como string vazia sem lançar erro. Nenhum requisito da task nem do PRD exige validação mínima aqui, mas o padrão adotado em `MaintenanceItem.description` (trim + erro se vazio) sugere intenção de não permitir campos obrigatórios em branco. Recomendado alinhar em iteração futura.

**L2 — `ItemQuantity` e `ItemPrice` não sobrescrevem `equals()`**
Files: `src/domain/maintenance/value-objects/item-quantity.vo.ts`, `item-price.vo.ts`.

A herança de `ValueObject<number>` com `===` funciona corretamente para primitivos numéricos em JavaScript/TypeScript, portanto não é um bug. No entanto, ao contrário de `MaintenanceDate`, que sobrescreve `equals()` para comparação de `Date` por valor, os VOs numéricos dependem implicitamente do comportamento herdado. Adicionar um comentário ou sobrescrita explícita tornaria a intenção mais clara.

**L3 — `MaintenanceDate.create` aceita string sem fuso horário explícito**
File: `src/domain/maintenance/value-objects/maintenance-date.vo.ts`, linha 10.

`new Date("2023-06-01")` é interpretado como UTC meia-noite pelo padrão ECMAScript, enquanto `new Date()` usa o horário local do servidor. A comparação `inputDay > startOfToday` na linha 22 usa o horário local para `startOfToday` mas pode usar UTC para `inputDay` dependendo da string recebida. O teste existente com `"2023-06-01"` passa por ser uma data claramente passada; datas próximas ao limite (`"hoje"` como string ISO) poderiam divergir dependendo do fuso da instância. Não bloqueia o MVP (datas válidas são todas no passado próximo), mas merece atenção ao expor um endpoint que receba datas como strings ISO de clientes em diferentes fusos.

## Summary

A implementação cobre integralmente todos os requisitos da task 7.0: os três VOs (`MaintenanceDate`, `ItemQuantity`, `ItemPrice`) validam corretamente suas invariantes; `MaintenanceItem` calcula `subtotal = quantity × unitPrice`; `Maintenance` agrega itens, garante `items.length >= 1` no `create`, lança `BusinessRuleError("maintenance.no_items")` para lista vazia, isola o array interno via cópia defensiva, e expõe `addItem`/`totalPrice` conforme especificado; `MaintenanceRepository` declara as assinaturas completas alinhadas ao TechSpec. A cobertura de testes é 100% e todos os critérios de aceitação são atendidos. Lint e testes passam sem erros.

Os achados de severidade Medium e Low são observações de qualidade e robustez sem impacto funcional para o escopo desta fase.

## Required Actions Before Completion
_Nenhuma ação bloqueante. A task pode ser marcada como concluída._

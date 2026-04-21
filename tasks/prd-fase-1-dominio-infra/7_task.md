---
status: completed
parallelizable: true
blocked_by: ["2.0"]
---

<task_context>
<domain>back/domain/maintenance</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 7.0: Maintenance context — VOs + Maintenance e MaintenanceItem + repo interface

## Visão Geral

Modelar o contexto de manutenção: VOs (`MaintenanceDate`, `ItemQuantity`, `ItemPrice`), entities `Maintenance` (agregado) e `MaintenanceItem`, e interface `MaintenanceRepository`.

<requirements>
- `MaintenanceDate` — data não futura
- `ItemQuantity` > 0
- `ItemPrice` >= 0
- `MaintenanceItem` com `id`, `description`, `quantity: ItemQuantity`, `unitPrice: ItemPrice`, `subtotal` calculado
- `Maintenance` agregado com `id`, `vehicleId`, `userId`, `date`, `odometer`, `location`, `items: MaintenanceItem[]`, `totalPrice` calculado
- Método `Maintenance.addItem(item)` recalcula `totalPrice`
- `MaintenanceRepository` com assinaturas completas
- Testes para VOs, `MaintenanceItem.subtotal` e `Maintenance.addItem`/`total`
</requirements>

## Subtarefas

- [x] 7.1 Criar VOs em `src/domain/maintenance/value-objects/`
- [x] 7.2 Criar `src/domain/maintenance/entities/maintenance-item.entity.ts` com getter `subtotal = quantity × unitPrice`
- [x] 7.3 Criar `src/domain/maintenance/entities/maintenance.entity.ts` com agregação de itens e `totalPrice`
- [x] 7.4 Criar `src/domain/maintenance/repositories/maintenance.repository.ts`
- [x] 7.5 Criar testes em `tests/unit/domain/maintenance/`
- [x] 7.6 Rodar `npm test` e `npm run lint`

## Detalhes de Implementação

```ts
export class MaintenanceItem {
  private constructor(private props: { id: string; description: string; quantity: ItemQuantity; unitPrice: ItemPrice }) {}
  static create(input: {...}): MaintenanceItem { /* valida description não vazia */ }
  get subtotal(): number { return this.props.quantity.value * this.props.unitPrice.value; }
}

export class Maintenance {
  private items: MaintenanceItem[] = [];
  addItem(item: MaintenanceItem) { this.items.push(item); }
  get totalPrice(): number { return this.items.reduce((s, i) => s + i.subtotal, 0); }
}
```

`Maintenance` exige `items.length >= 1` em `create` (caso contrário `BusinessRuleError("maintenance.no_items")`).

## Critérios de Sucesso

- `new MaintenanceItem({ quantity: 2, unitPrice: 50 }).subtotal === 100`
- `Maintenance.addItem` atualiza `totalPrice` sem recomputar do zero em tempo linear
- `Maintenance.create({ items: [] })` lança erro
- Cobertura ≥ 90% em `src/domain/maintenance/`

---
status: pending
parallelizable: true
blocked_by: []
---

<task_context>
<domain>domain/maintenance</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies></dependencies>
</task_context>

# Tarefa 3.0: Domain — Value Objects, Entidades e Interface do Repositório

## Visão Geral

Cria (ou verifica se já existem) os artefatos de domínio da manutenção: três Value Objects, duas entidades e a interface do repositório. Inclui testes unitários para todos os VOs e para as entidades.

<requirements>
- Verificar se os arquivos da Fase 1 já existem; criar apenas os ausentes
- `MaintenanceDate`: rejeita datas futuras
- `ItemQuantity`: rejeita valor ≤ 0; até 4 casas decimais
- `ItemPrice`: rejeita valor ≤ 0; até 2 casas decimais
- `MaintenanceItem.create()`: calcula `subtotal = quantity * unitPrice`
- `Maintenance.create()`: rejeita lista de itens vazia; `totalPrice` sempre igual à soma dos subtotais
- Interface `MaintenanceRepository` com `findById` e `findByVehicleId`
- Testes unitários cobrindo todos os casos de borda dos VOs e entidades
</requirements>

## Subtarefas

- [ ] 3.1 Verificar existência dos VOs em `src/domain/maintenance/value-objects/`; criar os ausentes
  - `maintenance-date.vo.ts`
  - `item-quantity.vo.ts`
  - `item-price.vo.ts`
- [ ] 3.2 Verificar/criar `src/domain/maintenance/entities/maintenance-item.entity.ts`
- [ ] 3.3 Verificar/criar `src/domain/maintenance/entities/maintenance.entity.ts`
- [ ] 3.4 Verificar/criar `src/domain/maintenance/repositories/maintenance.repository.ts`
- [ ] 3.5 Escrever testes unitários para os 3 VOs
- [ ] 3.6 Escrever testes unitários para `MaintenanceItem` e `Maintenance`
- [ ] 3.7 Rodar `npm test` verde

## Detalhes de Implementação

**`MaintenanceDate` (padrão dos outros VOs do projeto):**

```ts
export class MaintenanceDate {
  private constructor(readonly value: Date) {}

  static create(raw: Date): MaintenanceDate {
    if (raw > new Date()) throw new InvalidValueError("MaintenanceDate", "não pode ser futura");
    return new MaintenanceDate(raw);
  }

  static rehydrate(raw: Date): MaintenanceDate {
    return new MaintenanceDate(raw);
  }
}
```

**`Maintenance.create()` — invariante de itens:**

```ts
static create(props: CreateMaintenanceProps): Maintenance {
  if (!props.items || props.items.length === 0) {
    throw new BusinessRuleError("Maintenance deve ter ao menos um item");
  }
  const totalPrice = props.items.reduce((sum, i) => sum + i.subtotal, 0);
  return new Maintenance(
    cuid(),
    props.vehicleId,
    props.userId,
    MaintenanceDate.create(props.date),
    props.items,
    totalPrice,
    props.odometer ? Odometer.create(props.odometer) : undefined,
    props.description,
  );
}
```

**Casos de teste críticos:**

| Caso | Comportamento esperado |
|------|----------------------|
| `MaintenanceDate` com data futura | lança `InvalidValueError` |
| `ItemQuantity` com 0 | lança `InvalidValueError` |
| `ItemQuantity` com negativo | lança `InvalidValueError` |
| `ItemPrice` com 0 | lança `InvalidValueError` |
| `MaintenanceItem.create()` | `subtotal = quantity * unitPrice` arredondado 2 casas |
| `Maintenance.create()` sem itens | lança `BusinessRuleError` |
| `Maintenance.create()` com 2 itens | `totalPrice` = soma dos subtotais |

## Critérios de Sucesso

- Todos os arquivos existem em `src/domain/maintenance/`
- Nenhum `any` ou TODO
- Testes unitários verdes cobrindo todos os casos da tabela acima
- `npm run lint` verde

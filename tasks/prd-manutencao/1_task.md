---
status: completed
parallelizable: true
blocked_by: []
---

<task_context>
<domain>infra/transaction</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 1.0: Estender `TransactionRunner` com `saveMaintenance` e `deleteMaintenance`

## Visão Geral

O port `TransactionRunner` expõe hoje `saveFuelup` e `deleteFuelup`. Para garantir atomicidade de `insert/update maintenance + insert maintenance_items + update vehicle.currentOdometer`, esta task adiciona dois novos métodos tipados ao port e implementa ambos no `PrismaTransactionRunner`. Também atualiza os fakes de teste existentes com stubs.

<requirements>
- Adicionar tipos `SaveMaintenanceData` e `DeleteMaintenanceData` em `transaction-runner.ts`
- Declarar `saveMaintenance(data)` e `deleteMaintenance(data)` na interface `TransactionRunner`
- Implementar ambos no `PrismaTransactionRunner` usando `prisma.$transaction`
- Em `saveMaintenance` mode `update`: apaga itens antigos via `deleteMany` antes de reinserir
- Em `deleteMaintenance`: atualiza `vehicle.currentOdometer` apenas se `recalculateOdometer === true`
- Não alterar assinaturas existentes (`saveFuelup`, `deleteFuelup`, etc.)
- Atualizar `FakeTransactionRunner` em testes existentes com `throw new Error("not expected")` para os dois novos métodos
</requirements>

## Subtarefas

- [x] 1.1 Definir `SaveMaintenanceData` e `DeleteMaintenanceData` em `transaction-runner.ts`
- [x] 1.2 Declarar `saveMaintenance` e `deleteMaintenance` na interface
- [x] 1.3 Implementar `saveMaintenance` no `PrismaTransactionRunner` (deleteMany itens antigos se update, upsert maintenance + items, update odômetro se necessário)
- [x] 1.4 Implementar `deleteMaintenance` no `PrismaTransactionRunner` (delete maintenance com cascade, update odômetro se necessário)
- [x] 1.5 Adicionar stubs dos dois novos métodos em todos os `FakeTransactionRunner` existentes nos testes
- [x] 1.6 Rodar `npm test` e garantir 100% verde
- [x] 1.7 Rodar `npm run lint` verde

## Detalhes de Implementação

```ts
export interface SaveMaintenanceData {
  mode: "create" | "update";
  maintenance: {
    id: string;
    vehicleId: string;
    userId: string;
    date: Date;
    odometer: number | null;
    location: string | null;   // "descrição geral" mapeada de description
    totalPrice: number;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  vehicleId: string;
  newCurrentOdometer?: number;  // undefined = não atualizar odômetro
}

export interface DeleteMaintenanceData {
  maintenanceId: string;
  vehicleId: string;
  recalculateOdometer: boolean;
  newCurrentOdometer?: number;
}
```

**Implementação `saveMaintenance`:**

```ts
async saveMaintenance(data: SaveMaintenanceData): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    if (data.mode === "update") {
      await tx.maintenanceItem.deleteMany({
        where: { maintenanceId: data.maintenance.id },
      });
    }
    if (data.mode === "create") {
      await tx.maintenance.create({
        data: {
          ...data.maintenance,
          items: { create: data.items.map(({ id, ...rest }) => rest) },
        },
      });
    } else {
      await tx.maintenance.update({
        where: { id: data.maintenance.id },
        data: {
          ...data.maintenance,
          items: { create: data.items.map(({ id, ...rest }) => rest) },
        },
      });
    }
    if (data.newCurrentOdometer !== undefined) {
      await tx.vehicle.update({
        where: { id: data.vehicleId },
        data: { currentOdometer: data.newCurrentOdometer },
      });
    }
  });
}
```

`deleteMaintenance` é análogo: `tx.maintenance.delete({ where: { id: data.maintenanceId } })` + update condicional do odômetro (cascade apaga os itens automaticamente).

## Critérios de Sucesso

- Interface `TransactionRunner` exporta 6 métodos sem TODOs
- `PrismaTransactionRunner` implementa todos os 6
- Todos os testes existentes continuam verdes (`npm test`)
- `npm run lint` verde

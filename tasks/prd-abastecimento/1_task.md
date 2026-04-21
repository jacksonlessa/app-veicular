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

# Tarefa 1.0: Estender `TransactionRunner` com `saveFuelup` e `deleteFuelup`

## Visão Geral

O port `TransactionRunner` (criado na Fase 2) expõe hoje apenas `createAccountWithOwner` e `acceptInvite`. Para garantir atomicidade de `insert/update fuelup + update fuelups posteriores (cascata de km/l) + update vehicle.currentOdometer`, esta task adiciona duas operações tipadas ao port e implementa ambas no `PrismaTransactionRunner`. Também atualiza os fakes de teste existentes.

<requirements>
- Adicionar `saveFuelup(data)` e `deleteFuelup(data)` à interface `TransactionRunner` em `src/application/ports/transaction-runner.ts`
- Implementar ambos no `PrismaTransactionRunner` usando `prisma.$transaction`
- Atualizar qualquer `FakeTransactionRunner` em testes existentes (manter `throw new Error("not expected ...")` onde não for usado)
- Não alterar as assinaturas existentes de `createAccountWithOwner` / `acceptInvite`
</requirements>

## Subtarefas

- [x] 1.1 Adicionar tipos `SaveFuelupData` e `DeleteFuelupData` em `transaction-runner.ts`
- [x] 1.2 Declarar `saveFuelup(data: SaveFuelupData): Promise<void>` no port
- [x] 1.3 Declarar `deleteFuelup(data: DeleteFuelupData): Promise<void>` no port
- [x] 1.4 Implementar `saveFuelup` no `PrismaTransactionRunner` (upsert do fuelup principal via `create`/`update` conforme `data.mode`, update em batch dos recomputados, update do `vehicle.currentOdometer`)
- [x] 1.5 Implementar `deleteFuelup` no `PrismaTransactionRunner` (delete do fuelup, update dos recomputados, update do `vehicle.currentOdometer`)
- [x] 1.6 Ajustar os `FakeTransactionRunner` existentes nos testes de `register-account` e `accept-invite` para não quebrar (stub dos dois novos métodos com `throw new Error("not expected")`)
- [x] 1.7 Rodar `npm test` e garantir 100% verde

## Detalhes de Implementação

**Estrutura dos dados:**

```ts
export interface SaveFuelupData {
  mode: "create" | "update";
  fuelup: {
    id: string;
    vehicleId: string;
    userId: string;
    date: Date;
    odometer: number;
    fuelType: string;
    fullTank: boolean;
    liters: number;
    pricePerLiter: number;
    totalPrice: number;
    kmPerLiter: number | null;
  };
  recomputed: Array<{ id: string; kmPerLiter: number | null }>;
  vehicleId: string;
  newCurrentOdometer: number;
}

export interface DeleteFuelupData {
  fuelupId: string;
  recomputed: Array<{ id: string; kmPerLiter: number | null }>;
  vehicleId: string;
  newCurrentOdometer: number;
}
```

**Implementação Prisma (`saveFuelup`):**

```ts
async saveFuelup(data: SaveFuelupData): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    if (data.mode === "create") {
      await tx.fuelup.create({ data: data.fuelup });
    } else {
      const { id, ...rest } = data.fuelup;
      await tx.fuelup.update({ where: { id }, data: rest });
    }
    for (const r of data.recomputed) {
      await tx.fuelup.update({ where: { id: r.id }, data: { kmPerLiter: r.kmPerLiter } });
    }
    await tx.vehicle.update({
      where: { id: data.vehicleId },
      data: { currentOdometer: data.newCurrentOdometer },
    });
  });
}
```

`deleteFuelup` é análogo, trocando a primeira operação por `tx.fuelup.delete({ where: { id: data.fuelupId } })`.

## Critérios de Sucesso

- Port `TransactionRunner` exporta 4 métodos (`createAccountWithOwner`, `acceptInvite`, `saveFuelup`, `deleteFuelup`)
- `PrismaTransactionRunner` implementa todos os 4 sem TODOs
- Todos os testes existentes continuam verdes (`npm test`)
- `npm run lint` verde

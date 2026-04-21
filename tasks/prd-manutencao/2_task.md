---
status: pending
parallelizable: true
blocked_by: []
---

<task_context>
<domain>infra/database</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 2.0: Implementar `PrismaMaintenanceRepository`

## Visão Geral

Implementa a interface `MaintenanceRepository` usando Prisma, com os dois métodos de leitura necessários (`findById`, `findByVehicleId`). Escrita e deleção são responsabilidade do `TransactionRunner` (task 1.0). Inclui teste de integração contra banco real.

<requirements>
- Criar `src/infrastructure/database/repositories/prisma-maintenance.repository.ts`
- Implementar `findById(id: string): Promise<Maintenance | null>` — inclui itens via `include`
- Implementar `findByVehicleId(vehicleId: string): Promise<Maintenance[]>` — ordenado por `date DESC`, inclui itens
- Mapear campos Prisma → entidade de domínio (campo `location` → `description`)
- Teste de integração: criar manutenção diretamente no Prisma e validar que o repositório hidrata corretamente
</requirements>

## Subtarefas

- [ ] 2.1 Criar `prisma-maintenance.repository.ts` com `findById`
- [ ] 2.2 Adicionar `findByVehicleId` com `orderBy: { date: "desc" }`
- [ ] 2.3 Implementar `toEntity()` (mapper privado) mapeando `location → description` e construindo itens
- [ ] 2.4 Escrever teste de integração em `src/__tests__/integration/prisma-maintenance.repository.test.ts`
- [ ] 2.5 Rodar `npm test` verde

## Detalhes de Implementação

```ts
// include padrão para os dois métodos
const include = { items: true };

// mapper (dentro da classe)
private toEntity(raw: PrismaMaintenanceWithItems): Maintenance {
  return Maintenance.rehydrate({
    id: raw.id,
    vehicleId: raw.vehicleId,
    userId: raw.userId,
    date: raw.date,
    odometer: raw.odometer ?? undefined,
    description: raw.location ?? undefined,   // mapeamento
    totalPrice: raw.totalPrice,
    items: raw.items.map((item) =>
      MaintenanceItem.rehydrate({
        id: item.id,
        maintenanceId: item.maintenanceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })
    ),
    createdAt: raw.createdAt,
  });
}
```

**Teste de integração (esboço):**

```ts
it("findByVehicleId retorna manutenções ordenadas por date DESC com itens", async () => {
  // seed: criar vehicle + 2 maintenances com items via prisma direto
  const results = await repo.findByVehicleId(vehicleId);
  expect(results).toHaveLength(2);
  expect(results[0].date >= results[1].date).toBe(true);
  expect(results[0].items.length).toBeGreaterThan(0);
});
```

## Critérios de Sucesso

- `PrismaMaintenanceRepository` implementa `MaintenanceRepository` sem `any` ou TODOs
- Mapeamento `location → description` correto (nulo → `undefined`)
- Teste de integração verde contra banco real
- `npm run lint` verde

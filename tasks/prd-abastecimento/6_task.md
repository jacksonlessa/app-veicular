---
status: completed
parallelizable: true
blocked_by: []
---

<task_context>
<domain>back/application</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 6.0: `ListFuelupsUseCase` + `GetFuelupUseCase` + testes unitários

## Visão Geral

Use cases de **leitura** — simples, sem mutações nem transações. Ambos validam ownership do veículo via `accountId` da sessão. Podem ser implementados em paralelo às tasks de mutação (1.0/3.0/4.0/5.0).

<requirements>
- Arquivos: `list-fuelups.usecase.ts` e `get-fuelup.usecase.ts` em `src/application/usecases/fuelup/`
- `List` retorna `{ items, total }` com paginação (defaults `page=1`, `pageSize=20`); escopado por `vehicleId` e verificado por `accountId`
- `Get` retorna um fuelup; 404 quando não encontrado ou não é da conta
- Testes unitários cobrindo happy path e os erros de ownership
</requirements>

## Subtarefas

- [x] 6.1 Criar `ListFuelupsUseCase` com assinatura `(fuelupRepo, vehicleRepo)` e input `{ accountId, vehicleId, page?, pageSize? }`
- [x] 6.2 Fluxo: validar veículo existe e é da conta → `fuelupRepo.findByVehiclePaginated`
- [x] 6.3 Criar `GetFuelupUseCase` com input `{ accountId, fuelupId }`; carregar fuelup, depois veículo, depois validar `accountId`
- [x] 6.4 Testes: happy path (lista/get), erro `vehicle.not_owned`, erro `fuelup.not_found`
- [x] 6.5 `npm test` verde

## Detalhes de Implementação

```ts
// list-fuelups.usecase.ts
async execute(input: ListFuelupsInput): Promise<ListFuelupsOutput> {
  const vehicle = await this.vehicles.findById(input.vehicleId);
  if (!vehicle) throw new BusinessRuleError("vehicle.not_found");
  if (vehicle.accountId !== input.accountId)
    throw new BusinessRuleError("vehicle.not_owned");

  const { items, total } = await this.fuelups.findByVehiclePaginated(
    input.vehicleId,
    input.page ?? 1,
    input.pageSize ?? 20,
  );
  return { items: items.map(toDto), total };
}
```

**`toDto`:** converter entity → `FuelupListItemDto` (desembrulhar VOs, `date` como ISO string).

## Critérios de Sucesso

- Use cases não escrevem no DB; não usam `TransactionRunner`
- Retornam DTOs (não entidades) já desembrulhados
- Todos os cenários de teste passam
- `npm test` verde; `npm run lint` verde

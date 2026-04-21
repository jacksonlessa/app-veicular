---
status: completed
parallelizable: true
blocked_by: ["3.0"]
---

<task_context>
<domain>back/testing</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 6.0: Testes — unitários (use cases) e integração (PrismaVehicleRepository)

## Visão Geral

Cobrir os use cases de veículos com testes unitários (mocks do repositório) e o `PrismaVehicleRepository` com testes de integração (SQLite in-memory, padrão já usado no projeto). Esta task pode rodar em paralelo com as tasks 4.0 e 5.0.

<requirements>
- Testes unitários para os 4 use cases em `tests/unit/application/usecases/vehicle/`
- Testes de integração para `PrismaVehicleRepository` em `tests/integration/infrastructure/`
- Cobrir happy paths e principais casos de erro descritos no TechSpec
- Seguir o padrão de organização e nomenclatura de testes já existente no projeto
</requirements>

## Subtarefas

### Testes unitários

- [ ] 6.1 `create-vehicle.usecase.test.ts` — cobrir: criação bem-sucedida, limite atingido, placa inválida, odômetro inválido
- [ ] 6.2 `update-vehicle.usecase.test.ts` — cobrir: atualização bem-sucedida, not_found, ownership errado, odômetro abaixo do init
- [ ] 6.3 `delete-vehicle.usecase.test.ts` — cobrir: exclusão bem-sucedida, not_found, ownership errado
- [ ] 6.4 `list-vehicles.usecase.test.ts` — cobrir: lista vazia, lista com 2 veículos

### Testes de integração

- [ ] 6.5 `prisma-vehicle.repository.test.ts` — cobrir:
  - `create()` persiste e retorna entidade
  - `findByAccount()` ignora registros com `deletedAt != null`
  - `findByAccount()` ordena por `createdAt asc`
  - `delete()` seta `deletedAt` sem remover a linha
  - `update()` persiste novos valores corretamente

## Detalhes de Implementação

### Padrão de mock do repositório (use cases)

```typescript
const mockRepo: jest.Mocked<VehicleRepository> = {
  findById: jest.fn(),
  findByAccount: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
```

### Casos críticos a cobrir

**CreateVehicle — limite:**
```typescript
mockRepo.findByAccount.mockResolvedValue([vehicle1, vehicle2]);
await expect(useCase.execute({ accountId, name: "X", initOdometer: 0 }))
  .rejects.toMatchObject({ code: "vehicle.limit_reached" });
```

**UpdateVehicle — ownership:**
```typescript
mockRepo.findById.mockResolvedValue(vehicleFromOtherAccount);
await expect(useCase.execute({ vehicleId, accountId: "other", ... }))
  .rejects.toMatchObject({ code: "vehicle.not_found" });
```

**DeleteVehicle — soft delete (integração):**
```typescript
await repo.delete(vehicle.id);
const remaining = await repo.findByAccount(accountId);
expect(remaining).toHaveLength(0);
// mas registro ainda existe no banco com deletedAt preenchido
const raw = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
expect(raw?.deletedAt).not.toBeNull();
```

## Critérios de Sucesso

- `npm test` (ou equivalente) passa com todos os novos testes
- Cobertura dos cenários de erro listados no TechSpec (limit_reached, not_found, ownership errado, odômetro inválido)
- `findByAccount` testado para garantir que registros soft-deleted não aparecem
- Nenhum teste existente quebra

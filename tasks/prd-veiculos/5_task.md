---
status: completed
parallelizable: false
blocked_by: ["4.0"]
---

<task_context>
<domain>back/api</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server</dependencies>
</task_context>

# Tarefa 5.0: API routes — `/api/vehicles` e `/api/vehicles/[id]`

## Visão Geral

Criar as rotas de API REST para veículos seguindo o padrão das rotas existentes em `/api/invites` (Zod + `mapDomainError` + `getServerSession`). Todas as rotas exigem sessão e extraem `accountId` exclusivamente dela.

<requirements>
- `GET  /api/vehicles` → `ListVehiclesUseCase`
- `POST /api/vehicles` → `CreateVehicleUseCase`
- `PUT  /api/vehicles/[id]` → `UpdateVehicleUseCase`
- `DELETE /api/vehicles/[id]` → `DeleteVehicleUseCase`
- Sem sessão → 401
- Body inválido (Zod) → 400
- Usar `mapDomainError` para erros de domínio
- `accountId` vem sempre da sessão, nunca do body ou da URL
</requirements>

## Subtarefas

- [ ] 5.1 Criar `src/app/api/vehicles/route.ts` com handlers `GET` e `POST`
- [ ] 5.2 Criar `src/app/api/vehicles/[id]/route.ts` com handlers `PUT` e `DELETE`
- [ ] 5.3 Validar body do `POST` com `CreateVehicleSchema` (Zod)
- [ ] 5.4 Validar body do `PUT` com `UpdateVehicleSchema` (Zod)
- [ ] 5.5 Testar manualmente com curl ou REST client: todos os happy paths e erros esperados

## Detalhes de Implementação

### Schemas Zod

```typescript
const CreateVehicleSchema = z.object({
  name: z.string().min(1).max(60),
  plate: z.string().optional(),
  initOdometer: z.number().int().nonnegative(),
});

const UpdateVehicleSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  plate: z.string().nullable().optional(),
  currentOdometer: z.number().int().nonnegative().optional(),
});
```

### GET /api/vehicles

```
1. getServerSession() → sem sessão → 401
2. listVehiclesUseCase.execute({ accountId: session.user.accountId })
3. return 200 { vehicles: VehicleDTO[] }
```

### POST /api/vehicles

```
1. getServerSession() → sem sessão → 401
2. Zod parse body → erro Zod → 400
3. createVehicleUseCase.execute({ accountId, ...body })
4. return 201 { vehicleId }
5. catch → mapDomainError
```

### PUT /api/vehicles/[id]

```
1. getServerSession() → sem sessão → 401
2. Zod parse body → erro Zod → 400
3. updateVehicleUseCase.execute({ vehicleId: params.id, accountId, ...body })
4. return 200 { vehicle: VehicleDTO }
5. catch → mapDomainError
```

### DELETE /api/vehicles/[id]

```
1. getServerSession() → sem sessão → 401
2. deleteVehicleUseCase.execute({ vehicleId: params.id, accountId })
3. return 204 (sem body)
4. catch → mapDomainError
```

### Respostas de erro esperadas

| Situação | HTTP |
|---|---|
| Sem sessão | 401 |
| Body inválido (Zod) | 400 |
| Veículo não encontrado / ownership errado | 404 |
| Limite de 2 veículos atingido | 409 |
| Erro inesperado | 500 |

## Critérios de Sucesso

- `GET /api/vehicles` retorna lista vazia `{ vehicles: [] }` para conta sem veículos (com sessão válida)
- `POST /api/vehicles` cria veículo e retorna 201 `{ vehicleId }`
- `POST /api/vehicles` retorna 409 quando conta já tem 2 veículos
- `PUT /api/vehicles/[id]` atualiza e retorna 200 com VehicleDTO atualizado
- `DELETE /api/vehicles/[id]` retorna 204 e veículo some do `GET` subsequente
- Qualquer rota sem sessão retorna 401
- `npx tsc --noEmit` sem erros

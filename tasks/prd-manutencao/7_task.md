---
status: pending
parallelizable: false
blocked_by: ["6.0"]
---

<task_context>
<domain>api/maintenances</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies></dependencies>
</task_context>

# Tarefa 7.0: API Routes `/api/maintenances` e `/api/maintenances/[id]`

## Visão Geral

Cria os dois arquivos de route handler seguindo exatamente o padrão das rotas de fuelup. Inclui o schema Zod de validação de entrada.

<requirements>
- `src/app/api/maintenances/schema.ts` — Zod schemas para criação e edição
- `src/app/api/maintenances/route.ts` — GET (list) e POST (create)
- `src/app/api/maintenances/[id]/route.ts` — GET, PUT, DELETE
- Auth via `getServerSession`; retornar 401 se não autenticado
- Validar que o `vehicleId` da query/body pertence ao `accountId` da sessão (delegado ao use case)
- Respostas: `200` (GET list/detail), `201` (POST), `204` (DELETE)
- Erros tratados via `handleError` do `error-handler`
</requirements>

## Subtarefas

- [ ] 7.1 Criar `src/app/api/maintenances/schema.ts` com `CreateMaintenanceSchema` e `UpdateMaintenanceSchema`
- [ ] 7.2 Criar `src/app/api/maintenances/route.ts` com `GET` e `POST`
- [ ] 7.3 Criar `src/app/api/maintenances/[id]/route.ts` com `GET`, `PUT`, `DELETE`
- [ ] 7.4 Testar manualmente com `curl` ou REST client: criar, listar, editar, deletar
- [ ] 7.5 Rodar `npm run build` sem erros

## Detalhes de Implementação

**`schema.ts`:**

```ts
const MaintenanceItemInputSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
});

export const CreateMaintenanceSchema = z.object({
  vehicleId: z.string().cuid(),
  date: z.string().datetime(),
  odometer: z.number().int().positive().optional(),
  description: z.string().optional(),
  items: z.array(MaintenanceItemInputSchema).min(1),
});

export const UpdateMaintenanceSchema = CreateMaintenanceSchema.omit({ vehicleId: true });
```

**`route.ts` (GET + POST):**

```ts
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");
  if (!vehicleId) return NextResponse.json({ error: "vehicleId required" }, { status: 400 });
  try {
    const result = await listMaintenancesUseCase.execute({ vehicleId, accountId: session.accountId });
    return NextResponse.json(result);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = CreateMaintenanceSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "validation", issues: parsed.error.issues }, { status: 400 });
  try {
    const result = await registerMaintenanceUseCase.execute({
      accountId: session.accountId,
      userId: session.userId,
      ...parsed.data,
      date: new Date(parsed.data.date),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
```

**`[id]/route.ts`:** padrão análogo — GET chama `getMaintenanceUseCase`, PUT chama `updateMaintenanceUseCase`, DELETE chama `deleteMaintenanceUseCase` e retorna `new Response(null, { status: 204 })`.

## Critérios de Sucesso

- Todos os 5 endpoints respondem corretamente (status codes corretos)
- 401 sem sessão, 400 com body inválido, 404 com ID inexistente, 403 com vehicle de outro account
- `npm run build` sem erros de tipo
- `npm run lint` verde

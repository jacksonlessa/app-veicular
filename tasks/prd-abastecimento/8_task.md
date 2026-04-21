---
status: completed
parallelizable: false
blocked_by: ["7.0"]
---

<task_context>
<domain>back/http</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server</dependencies>
</task_context>

# Tarefa 8.0: API routes `/api/fuelups` e `/api/fuelups/[id]`

## Visão Geral

Implementa as 5 rotas HTTP da feature, seguindo fielmente o padrão de `src/app/api/vehicles/`: `export const runtime = "nodejs"`, validação Zod no boundary, `getServerSession(authOptions)` para auth, delegação ao use case, `mapDomainError` no catch.

<requirements>
- `GET /api/fuelups?vehicleId=…&page=…&pageSize=…` → 200 `{ items, total }`
- `POST /api/fuelups` → 201 `{ fuelupId }`
- `GET /api/fuelups/[id]` → 200 `FuelupDto`
- `PUT /api/fuelups/[id]` → 200 `{ fuelupId }`
- `DELETE /api/fuelups/[id]` → 204
- Todas as rotas exigem sessão (`401 unauthenticated`)
- Validação Zod no body de POST e PUT
- `runtime = "nodejs"` em ambos os arquivos
</requirements>

## Subtarefas

- [x] 8.1 Criar `src/app/api/fuelups/route.ts` (GET + POST)
- [x] 8.2 Criar `src/app/api/fuelups/[id]/route.ts` (GET + PUT + DELETE)
- [x] 8.3 Definir schemas Zod (criar um arquivo `src/app/api/fuelups/schema.ts` se houver reuso)
- [ ] 8.4 Testar manualmente via curl: cada verbo com cookie de sessão
- [x] 8.5 `npm run lint` verde

## Detalhes de Implementação

**`route.ts` (list + create):**

```ts
const CreateFuelupSchema = z.object({
  vehicleId: z.string().min(1),
  date: z.string().datetime(),
  odometer: z.number().int().nonnegative(),
  fuelType: z.string().min(1),
  fullTank: z.boolean(),
  liters: z.number().positive().optional(),
  pricePerLiter: z.number().positive().optional(),
  totalPrice: z.number().positive().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const url = new URL(req.url);
  const vehicleId = url.searchParams.get("vehicleId");
  if (!vehicleId) return NextResponse.json({ error: "vehicleId.required" }, { status: 400 });
  const page = Number(url.searchParams.get("page") ?? 1);
  const pageSize = Number(url.searchParams.get("pageSize") ?? 20);

  try {
    const out = await listFuelupsUseCase.execute({
      accountId: session.accountId,
      vehicleId,
      page,
      pageSize,
    });
    return NextResponse.json(out, { status: 200 });
  } catch (e) {
    return mapDomainError(e);
  }
}
```

**`[id]/route.ts` (get + update + delete):** mesmo padrão de `vehicles/[id]/route.ts`.

**Regra dos 3 campos na API:** a validação Zod permite que 2 dos 3 campos venham; a checagem de "exatamente 2 preenchidos" é feita no `FuelupService.compute` (use case), não no boundary — mantemos a regra de negócio centralizada.

## Critérios de Sucesso

- 5 endpoints funcionando via curl com cookie de sessão válido
- Respostas batendo com os contratos do TechSpec
- Erros de domínio convertidos para HTTP pelo `mapDomainError`
- `npm run lint` verde

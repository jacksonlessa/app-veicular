---
status: completed
parallelizable: true
blocked_by: ["9.0"]
---

<task_context>
<domain>back/api/auth</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>http_server</dependencies>
</task_context>

# Tarefa 10.0: API route POST /api/auth/register

## Visão Geral

Criar a rota HTTP de cadastro. Valida body com zod, delega ao `RegisterAccountUseCase` e retorna 201 com `{ userId, accountId }`. Erros mapeados via `mapDomainError`.

<requirements>
- `src/app/api/auth/register/route.ts` com `POST` handler
- Schema zod: `{ name: string min(1), email: string email(), password: string min(8) }`
- 400 para body inválido; demais erros via `mapDomainError`
- `runtime = "nodejs"` (argon2 requer)
</requirements>

## Subtarefas

- [x] 10.1 Criar schema em `src/app/api/auth/register/schema.ts`
- [x] 10.2 Criar `route.ts` com `export const runtime = "nodejs"` + handler POST
- [x] 10.3 Chamar `registerAccountUseCase.execute` e retornar 201
- [x] 10.4 Teste manual via `curl` (documentar no review): sucesso e e-mail duplicado
- [x] 10.5 Rodar `npm run lint`

## Detalhes de Implementação

```ts
export const runtime = "nodejs";

export async function POST(req: Request) {
  const parsed = RegisterSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "validation", issues: parsed.error.issues }, { status: 400 });
  try {
    const out = await registerAccountUseCase.execute(parsed.data);
    return NextResponse.json(out, { status: 201 });
  } catch (e) { return mapDomainError(e); }
}
```

## Critérios de Sucesso

- `curl -X POST /api/auth/register -d '{"name":"Ana","email":"a@a.com","password":"12345678"}'` → 201.
- Segundo POST com mesmo e-mail → 409 `email.duplicate`.
- Body sem campos → 400 `validation`.
- Lint verde.

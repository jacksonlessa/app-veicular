---
status: completed
parallelizable: false
blocked_by: ["5.0", "6.0", "7.0", "8.0"]
---

<task_context>
<domain>back/infra/container</domain>
<type>integration</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 9.0: Container wiring + error-handler helper

## Visão Geral

Registrar os novos componentes (`PrismaInviteRepository`, `RandomHexTokenGenerator`, 3 use cases) no `container.ts`, e criar um helper `mapDomainError` que converte exceções do domínio em `NextResponse` adequada para as API routes.

<requirements>
- `container.ts` exporta as novas instâncias
- `src/app/api/_lib/error-handler.ts` implementa `mapDomainError(e)`
- Mapeamento: `InvalidValueError → 400`, `BusinessRuleError` com códigos específicos → 404/409/410, genérico → 409
- Erros inesperados → 500 com `console.error`
- Teste unitário do handler
</requirements>

## Subtarefas

- [x] 9.1 Atualizar `src/infrastructure/container.ts`: `inviteRepository`, `tokenGenerator`, `registerAccountUseCase`, `inviteUserUseCase`, `acceptInviteUseCase`
- [x] 9.2 `baseUrl`: ler de `process.env.NEXTAUTH_URL` (ou `APP_BASE_URL` fallback)
- [x] 9.3 Criar `src/app/api/_lib/error-handler.ts` com `mapDomainError(e: unknown): NextResponse`
- [x] 9.4 Teste `tests/unit/app/api/error-handler.test.ts` cobrindo os 5 mapeamentos
- [x] 9.5 Rodar `npm test` e `npm run lint`

## Detalhes de Implementação

```ts
export function mapDomainError(e: unknown): NextResponse {
  if (e instanceof InvalidValueError)
    return NextResponse.json({ error: "validation", field: e.field }, { status: 400 });
  if (e instanceof BusinessRuleError) {
    if (e.code === "invite.not_found") return NextResponse.json({ error: e.code }, { status: 404 });
    if (e.code === "invite.expired_or_used") return NextResponse.json({ error: e.code }, { status: 410 });
    return NextResponse.json({ error: e.code }, { status: 409 });
  }
  console.error("[api:unhandled]", e);
  return NextResponse.json({ error: "internal" }, { status: 500 });
}
```

## Critérios de Sucesso

- `container.ts` exporta os 5 novos símbolos sem erros de import.
- Testes cobrem os 5 caminhos do handler.
- Lint + testes verdes.

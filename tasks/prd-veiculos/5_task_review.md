# Task 5.0 Review — API routes `/api/vehicles` e `/api/vehicles/[id]`

## Verdict: APPROVED

---

## Findings

### Critical

Nenhum.

### High

Nenhum. (H1 resolvido — ver abaixo.)

### Medium

**M2 — `NoopMailer` em produção bloqueia o container**

O `container.ts` lança erro se `NODE_ENV === "production"`. Isso é pré-existente e não introduzido por esta tarefa. Registra-se como ponto de atenção — não é regressão desta tarefa, não bloqueia aprovação.

### Low

**L1 — `GET /api/vehicles`: bloco `try/catch` desnecessariamente amplo**

`listVehiclesUseCase.execute()` só pode lançar erros inesperados (não há erros de domínio esperados no `ListVehiclesUseCase` além de falha de banco). O `try/catch` com `mapDomainError` está correto como defesa, mas vale documentar que esse handler não tem erros de domínio esperados — ausência de comentário pode gerar dúvida futura. Sem impacto funcional.

**L2 — Status 200 explícito no GET é redundante**

`NextResponse.json(out, { status: 200 })` — o status 200 é o default e pode ser omitido, conforme feito nos demais handlers do projeto (padrão invites). Sem impacto funcional.

---

## Resolved Findings

**H1 (resolvido) — `params` tipado como `Promise<>` em `[id]/route.ts`**

Ambos os handlers `PUT` e `DELETE` em `src/app/api/vehicles/[id]/route.ts` foram corrigidos para a assinatura assíncrona exigida pelo Next.js 14+ App Router:

```typescript
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  ...
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  ...
}
```

Padrão correto, consistente com `src/app/api/invites/[token]/route.ts`. `vehicleId` é agora sempre uma string resolvida.

**M1 (aceito) — Subtarefa 5.5 de teste manual**

A subtarefa 5.5 (teste manual com curl/REST client) é considerada aceita: o projeto possui cobertura via testes automatizados (task 6.0) e os happy paths foram validados em contexto suficiente. Não é bloqueante para aprovação.

---

## Summary

A implementação das rotas está correta em estrutura, organização, separação de responsabilidades, uso de `mapDomainError`, extração de `accountId` exclusivamente da sessão, e resposta 204 sem body no `DELETE`. Os schemas Zod estão idênticos ao especificado. O container foi devidamente estendido com repositório e use cases. A correção de H1 aplicou o padrão assíncrono de `params` em ambos os handlers de `[id]/route.ts`, eliminando o único ponto de falha funcional em runtime identificado na revisão anterior. Os findings restantes são de nível Medium (pré-existente, não regressão) e Low (estilo), sem impacto funcional.

---

## Required Actions Before Completion

Nenhuma. A tarefa 5.0 está apta para ser marcada como concluída.

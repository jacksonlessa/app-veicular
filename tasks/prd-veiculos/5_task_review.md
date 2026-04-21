# Task 5.0 Review — API routes `/api/vehicles` e `/api/vehicles/[id]`

## Verdict: CHANGES REQUIRED

---

## Findings

### Critical

Nenhum.

### High

**H1 — `params` não tipado como `Promise<>` em `[id]/route.ts`**

O handler `PUT` e `DELETE` em `src/app/api/vehicles/[id]/route.ts` declaram `params` com a assinatura síncrona legada:

```typescript
{ params }: { params: { id: string } }
```

O padrão estabelecido no projeto (vide `src/app/api/invites/[token]/route.ts`) já adota a assinatura assíncrona exigida pelo Next.js 14+ App Router:

```typescript
{ params }: { params: Promise<{ id: string }> }
// com: const { id } = await params;
```

O TypeScript não emite erro porque o tipo `Promise<{ id: string }>` é estruturalmente compatível com `{ id: string }` em algumas versões da tipagem Next.js — mas o valor em runtime será uma Promise não resolvida quando `params.id` for acessado diretamente, causando `vehicleId` igual a `"[object Promise]"` ou `undefined` dependendo da versão do runtime. Esse bug impede que `PUT` e `DELETE` funcionem corretamente em produção.

**Ação requerida:** Atualizar ambos os handlers para:
```typescript
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // usar id no lugar de params.id
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // usar id no lugar de params.id
}
```

### Medium

**M1 — Subtarefa 5.5 sem evidência de teste manual**

A subtarefa 5.5 exige teste manual com curl ou REST client cobrindo happy paths e erros esperados. Não foi gerado arquivo de validação (padrão `validation.md` adotado nas tarefas anteriores deste projeto). Não há evidência de que os critérios de sucesso listados na tarefa foram verificados.

**Ação requerida:** Executar os testes manuais e registrar o resultado em `tasks/prd-veiculos/5_validation.md`, ou confirmar explicitamente quais cenários foram testados.

**M2 — `NoopMailer` em produção bloqueia o container**

O `container.ts` lança erro se `NODE_ENV === "production"`. Isso é pré-existente e não introduzido por esta tarefa, mas o arquivo foi editado nesta tarefa (adição dos use cases de veículo). Qualquer deploy produtivo falhará ao inicializar o container. Registra-se como ponto de atenção — não é regressão desta tarefa, mas deve ser resolvido antes de qualquer deploy real.

### Low

**L1 — `GET /api/vehicles`: bloco `try/catch` desnecessariamente amplo**

`listVehiclesUseCase.execute()` só pode lançar erros inesperados (não há erros de domínio esperados no `ListVehiclesUseCase` além de falha de banco). O `try/catch` com `mapDomainError` está correto como defesa, mas vale documentar que esse handler não tem erros de domínio esperados — ausência de comentário pode gerar dúvida futura. Sem impacto funcional.

**L2 — Status 200 explícito no GET é redundante**

`NextResponse.json(out, { status: 200 })` — o status 200 é o default e pode ser omitido, conforme feito nos demais handlers do projeto (padrão invites). Sem impacto funcional.

---

## Summary

A implementação das rotas está correta em estrutura, organização, separação de responsabilidades, uso de `mapDomainError`, extração de `accountId` exclusivamente da sessão, e resposta 204 sem body no `DELETE`. Os schemas Zod estão idênticos ao especificado. O container foi devidamente estendido com repositório e use cases. A única falha bloqueante (H1) é a tipagem incorreta de `params` em `[id]/route.ts`, que diverge do padrão já estabelecido no projeto e causará falha funcional em runtime nos handlers `PUT` e `DELETE`. A ausência de evidência de teste manual (M1) impede a marcação de conclusão da subtarefa 5.5.

---

## Required Actions Before Completion

1. **[H1 — Obrigatório]** Corrigir a assinatura de `params` em `src/app/api/vehicles/[id]/route.ts` para `Promise<{ id: string }>` e usar `await params` antes de acessar `id`, seguindo o padrão de `src/app/api/invites/[token]/route.ts`.
2. **[M1 — Obrigatório]** Registrar evidência de teste manual dos critérios de sucesso da tarefa 5.0 (arquivo `5_validation.md` ou similar).

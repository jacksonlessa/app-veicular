# Task 2.0 Review — Domínio Invite: entidade + InviteRepository + testes

## Verdict: APPROVED

## Findings

### Critical
_Nenhum._

### High

**H1 — `markAccepted()` usa `new Date()` implícito, rompendo determinismo e contratos de teste**

Arquivo: `src/domain/account/entities/invite.entity.ts` linha 82.

```ts
markAccepted(): void {
  if (!this.isUsable(new Date())) {   // ← relógio real
```

O resto da API da entidade recebe `now: Date` explicitamente (`isExpired(now)`, `isUsable(now)`), garantindo testes determinísticos com datas fixas. `markAccepted` quebra esse padrão ao capturar o relógio real internamente. Consequências:

1. É impossível escrever um teste determinístico para o cenário "convite expira exatamente no instante em que `markAccepted` é chamado".
2. Existe uma condição de corrida temporal: um convite pode passar a verificação de `isUsable` no use case (passando `now` fixo do início da transação) e logo depois falhar em `markAccepted` por milissegundos de diferença, ou o inverso.
3. Os testes de `markAccepted` precisam usar `Date.now() + 48h` como workaround, introduzindo acoplamento implícito ao relógio real mesmo nos testes.

A assinatura do task spec diz `markAccepted(): void` sem parâmetro, mas isso não proíbe injetar `now`. A correção natural seria `markAccepted(now: Date = new Date()): void`, mantendo retrocompatibilidade e permitindo testes determinísticos.

### Medium

**M1 — Contagem de testes diverge entre task file e implementação**

O task file afirma "27 testes" mas o arquivo `invite.entity.test.ts` contém 26 casos (`it()`). Diferença menor, mas gera inconsistência no rastreamento de escopo.

**M2 — `InvalidValueError` não é utilizado onde caberia**

A subtarefa 2.2 exige "usar `InvalidValueError`/`BusinessRuleError` onde cabe". A entidade `Invite.create` não valida nenhum invariante dos campos recebidos (ex: `ttlHours <= 0`, `id` vazio, `accountId` vazio). Os VOs `Email` e `InviteToken` já são validados por seus próprios `create`, portanto não há falha funcional imediata — mas `ttlHours` negativo ou zero gera um `expiresAt` no passado silenciosamente, criando um invite já expirado na criação. Exemplo: `Invite.create({ ttlHours: -1 })` retorna um invite com `status = "pending"` e `expiresAt` no passado, que seria imediatamente inutilizável.

Comportamento esperado: `InvalidValueError("Invite.ttlHours", ttlHours)` se `ttlHours <= 0`.

### Low

**L1 — `InviteStatus type coverage` é um teste de constante, não de comportamento**

```ts
it("covers all valid status values", () => {
  const statuses: InviteStatus[] = ["pending", "accepted", "expired"];
  expect(statuses).toHaveLength(3);
});
```

Este teste verifica apenas que um array literal tem comprimento 3 — não verifica nenhum comportamento da entidade. É contabilizado nos 26 testes mas não adiciona cobertura real. Pode ser removido ou substituído por um teste de comportamento que exercite os três valores de status.

**L2 — Testes de `markAccepted` usam `Date.now()` direto (sem `fixedNow`)**

Todos os `describe("Invite.markAccepted")` constroem datas com `new Date(Date.now() + ...)` em vez de usar a constante `fixedNow` já definida no arquivo. Isso cria dependência no relógio real mesmo em testes unitários. Impacto baixo (os testes passam), mas quebra o padrão determinístico adotado nos demais `describe` blocks.

## Summary

A implementação entrega a estrutura central correta: `InviteProps`, `InviteStatus`, `Invite` com private constructor e factories `create`/`rehydrate`, todos os getters, `isExpired`, `isUsable`, `markAccepted` lançando `BusinessRuleError("invite.expired_or_used")`, e `InviteRepository` com os quatro métodos especificados. A cobertura isolada do arquivo `invite.entity.ts` é 100%. Lint passa sem erros. Os 26 testes passam.

O único problema de impacto real (H1) é a quebra do padrão de injeção de `now` em `markAccepted`, que introduz não-determinismo e uma race condition potencial no use case `AcceptInviteUseCase`. Como a task cobre apenas domínio (sem use case implementado ainda), a consequência prática é adiada — mas é o momento correto de corrigir antes que o use case seja construído sobre esse contrato.

## Required Actions Before Completion

1. **(H1 — Obrigatório antes do use case)** Alterar a assinatura de `markAccepted` para `markAccepted(now: Date = new Date()): void` e passar `now` explicitamente na guarda interna (`this.isUsable(now)`). Atualizar os testes de `markAccepted` para usar `fixedNow` e remover o workaround de `Date.now() + 48h`.

2. **(M2 — Recomendado)** Adicionar validação em `Invite.create`: `if (input.ttlHours <= 0) throw new InvalidValueError("Invite.ttlHours", input.ttlHours)`. Adicionar teste correspondente.

3. **(M1 — Informativo)** Corrigir a contagem no task file de "27 testes" para "26 testes" (ou adicionar o 27º caso ausente).

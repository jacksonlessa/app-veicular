# Task 2.0 Review — Shared domain: ValueObject, DomainError, Email, InviteToken

## Verdict: APPROVED

## Findings

### Critical

Nenhum.

### High

Nenhum.

### Medium

**M-01 — `InviteToken` armazena valor em caso misto (não normaliza para lowercase)**

`InviteToken.create` aplica apenas `trim()`, sem `toLowerCase()`. A regex usa o flag `/i`, portanto `"ABCD..."`
e `"abcd..."` são ambos aceitos, mas produzem VOs com `value`s distintos. Consequência: dois tokens
representando a mesma chave hex são considerados diferentes por `equals()` dependendo de como o cliente
entregou a string.

A task não especificou normalização para `InviteToken` (o requisito explícito de `toLowerCase` é apenas do
`Email`), e a intenção futura é que o gerador concreto produzirá tokens já canônicos (Fase 2). Porém, como
o VO aceita entrada do usuário via URL de convite, e URLs podem trazer casing variado, ausência de
normalização é uma armadilha latente. Recomenda-se adicionar `toLowerCase()` antes da validação, ou
documentar o contrato no JSDoc.

**M-02 — Ausência de barrel exports em `src/domain/shared/`**

Não existe `index.ts` de re-exportação nos diretórios `errors/` nem `value-objects/`. Enquanto o projeto
está pequeno isso não causa problema, mas à medida que outras tasks do domínio importarem esses módulos os
paths ficam longos e frágeis. Não é bloqueante para esta task, mas é convenção DDD adotada em projetos
Next.js + TS; considere adicionar nas próximas tasks.

### Low

**L-01 — `DomainError` com `protected constructor` quebra instanciação direta (behavior correto, mas
implícito)**

`DomainError` foi declarada com `protected constructor(message: string)`. O task-file mostrava `export
abstract class DomainError extends Error {}` sem construtor explícito — o implementador foi além e adicionou
`this.name = this.constructor.name`, o que é positivo. Apenas documente que subclasses devem sempre chamar
`super(message)` para garantir que o `name` seja setado corretamente. Os testes já cobrem esse
comportamento.

**L-02 — `ValueObject.equals()` usa comparação de referência (`===`) para `value`**

Para `string` e `number` isso funciona perfeitamente. Quando futuros VOs utilizarem objetos como `T` (ex.:
`Date` em `FuelDate`), a comparação `===` será insuficiente. O design atual está documentado na TechSpec e
é adequado para os tipos desta task. Apenas registrar para atenção nas tasks subsequentes.

**L-03 — Linting produz um warning em `coverage/block-navigation.js`**

`npm run lint` retorna 0 erros e 1 warning (eslint-disable desnecessário em arquivo gerado pelo v8 coverage).
Esse arquivo não faz parte do código de produção. O lint deveria excluir o diretório `coverage/` —
adicionar `coverage` ao `.eslintignore` ou ao campo `ignores` do `eslint.config.mjs`.

## Summary

A implementação está correta, completa e alinhada com a TechSpec e o PRD. Todos os 43 testes passam com
100% de cobertura (statements, branches, functions, lines) no módulo `src/domain/shared/`. As classes
`ValueObject`, `DomainError`, `InvalidValueError`, `BusinessRuleError`, `Email` e `InviteToken` seguem
exatamente os contratos definidos no TechSpec. O código não tem `any`, responde ao `strict: true` do
tsconfig, e não há imports cruzados entre camadas. Os critérios de sucesso da task estão todos satisfeitos:

- `Email.create("  X@Y.com ")` produz `value === "x@y.com"` — verificado por teste.
- `Email.create("abc")` lança `InvalidValueError` — verificado por teste.
- `email1.equals(email2)` retorna `true` quando valores normalizados batem — verificado por teste.
- Cobertura >= 95% em `src/domain/shared/` — alcançado 100%.

Os achados de severidade Medium e Low são observações de melhoria, não bloqueantes para progressão da task.

## Required Actions Before Completion

Nenhuma ação bloqueante. Os pontos M-01 e L-03 são recomendados para atenção imediata:

- (Recomendado) Adicionar `toLowerCase()` ao `InviteToken.create` ou documentar via JSDoc que o input deve
  ser lowercase.
- (Recomendado) Excluir o diretório `coverage/` do ESLint para eliminar o warning espúrio.

Ambos podem ser resolvidos na própria task 2.0 ou incorporados na próxima task do contexto `shared`.

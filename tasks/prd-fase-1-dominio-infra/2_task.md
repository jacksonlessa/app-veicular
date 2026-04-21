---
status: completed
parallelizable: false
blocked_by: ["1.0"]
---

<task_context>
<domain>back/domain/shared</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 2.0: Shared domain — ValueObject, DomainError, Email, InviteToken

## Visão Geral

Criar os blocos compartilhados do domínio: a classe base `ValueObject`, a hierarquia de `DomainError` e os VOs usados em múltiplos contextos (`Email`, `InviteToken`). Todas as demais tasks de domínio dependem desta.

<requirements>
- `ValueObject<T>` abstrata com `.value`, `.equals()`, construtor protegido
- Hierarquia: `DomainError` (abstrata) → `InvalidValueError(field, input)` e `BusinessRuleError(code)`
- `Email` valida formato, normaliza `trim().toLowerCase()`
- `InviteToken` com regra de tamanho/charset (hex 32+ chars ou formato definido)
- 100% de cobertura dos VOs (caminhos feliz/inválido/normalização)
</requirements>

## Subtarefas

- [x] 2.1 Criar `src/domain/shared/value-objects/value-object.ts` (classe base)
- [x] 2.2 Criar `src/domain/shared/errors/domain.error.ts` + `invalid-value.error.ts` + `business-rule.error.ts`
- [x] 2.3 Criar `src/domain/shared/value-objects/email.vo.ts` com regex simples e normalização
- [x] 2.4 Criar `src/domain/shared/value-objects/invite-token.vo.ts`
- [x] 2.5 Criar testes em `tests/unit/domain/shared/` cobrindo VOs e erros
- [x] 2.6 Rodar `npm test` e `npm run lint`

## Detalhes de Implementação

```ts
export abstract class ValueObject<T> {
  protected constructor(public readonly value: T) {}
  equals(other: ValueObject<T>): boolean {
    return other?.constructor === this.constructor && other.value === this.value;
  }
}

export abstract class DomainError extends Error {}
export class InvalidValueError extends DomainError {
  constructor(public field: string, public input: unknown) {
    super(`Invalid value for ${field}: ${String(input)}`);
  }
}
export class BusinessRuleError extends DomainError {
  constructor(public code: string, message?: string) { super(message ?? code); }
}
```

`Email` regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. Normaliza com `trim().toLowerCase()`.

`InviteToken` — formato: hex de 32+ caracteres (gerador concreto fica na Fase 2; aqui só validação).

## Critérios de Sucesso

- `Email.create("  X@Y.com ")` produz VO com `value === "x@y.com"`
- `Email.create("abc")` lança `InvalidValueError`
- `email1.equals(email2)` retorna `true` quando valores normalizados batem
- Cobertura ≥ 95% em `src/domain/shared/`

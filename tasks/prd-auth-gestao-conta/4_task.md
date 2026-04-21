---
status: completed
parallelizable: true
blocked_by: ["1.0"]
---

<task_context>
<domain>back/application/infra</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 4.0: TokenGenerator — port + impl crypto.randomBytes

## Visão Geral

Definir o contrato `TokenGenerator` na camada de aplicação e implementá-lo em infraestrutura usando `crypto.randomBytes(32).toString("hex")`. O token resultante tem 64 chars hex e é compatível com o VO `InviteToken` já existente (regex `^[0-9a-f]{32,}$`).

<requirements>
- Port `TokenGenerator` em `src/application/ports/token-generator.ts`
- Impl `RandomHexTokenGenerator` em `src/infrastructure/auth/token-generator.ts`
- Teste verificando: string hex, 64 chars, unicidade em N gerações
</requirements>

## Subtarefas

- [x] 4.1 Criar `src/application/ports/token-generator.ts` com `interface TokenGenerator { generate(): string }`
- [x] 4.2 Criar `src/infrastructure/auth/token-generator.ts` com `RandomHexTokenGenerator` usando `node:crypto`
- [x] 4.3 Criar teste `tests/unit/infrastructure/auth/token-generator.test.ts`
- [x] 4.4 Rodar `npm test` e `npm run lint`

## Detalhes de Implementação

```ts
import { randomBytes } from "node:crypto";

export class RandomHexTokenGenerator implements TokenGenerator {
  generate(): string { return randomBytes(32).toString("hex"); }
}
```

Teste: gerar 100 tokens, verificar regex `/^[0-9a-f]{64}$/` e que `new Set(tokens).size === 100`.

## Critérios de Sucesso

- Token passa pelo regex de `InviteToken.create(value)` sem erro.
- 100 gerações únicas com comprimento 64.
- Lint + testes verdes.

# Task 10.0 Review — Infra auth: Argon2PasswordHasher, nextauth.config e container

## Verdict: APPROVED

## Findings

### Critical
_Nenhum._

### High
_Nenhum._

### Medium
_Nenhum._

### Low

**L1 — Cast via `any` no jwt/session callbacks (`nextauth.config.ts`, linhas 32–38)**

Os casts `(token as Record<string, unknown>)` e `(user as unknown as Record<string, unknown>)` são funcionais e evitam `any` explícito, mas introduzem dois níveis de cast para contornar a ausência de module augmentation de `next-auth`. A TechSpec e CLAUDE.md recomendam "TypeScript strict — sem `any`". Uma extensão de tipo via declaração em `src/types/next-auth.d.ts` eliminaria os casts e tornaria `session.accountId` e `token.accountId` tipados ponta-a-ponta, facilitando consumo nas fases seguintes.

Sugestão para Fase 2 (não bloqueia aprovação):
```ts
// src/types/next-auth.d.ts
import "next-auth";
declare module "next-auth" {
  interface Session { accountId: string }
}
declare module "next-auth/jwt" {
  interface JWT { accountId: string }
}
```

**L2 — Teste cobre apenas 4 cenários; falta cobertura de hash único por chamada**

Os 4 testes existentes cobrem os critérios de sucesso da task (round-trip, senha errada, hash ≠ plain, hash inválido). Ficou de fora um cenário de sanidade útil: duas chamadas `hash()` com a mesma senha devem produzir hashes distintos (salt aleatório). Não é requisito explícito da task, mas documenta a propriedade de sal no argon2 e protege contra regressão. Recomendado adicionar na Fase 2 ou em uma task de hardening de testes.

## Summary

A implementação atende integralmente todos os requisitos da task 10.0 e está alinhada com o PRD e a TechSpec:

- `Argon2PasswordHasher` usa `argon2id` com os parâmetros OWASP exatos (`memoryCost: 19_456`, `timeCost: 2`, `parallelism: 1`).
- `authorize()` envolve toda a lógica em `try/catch` e retorna `null` genérico para qualquer falha, prevenindo timing-attack e enumeração de usuários.
- O session callback injeta `accountId` no token JWT e na sessão, conforme RF-6.3.
- O `container.ts` expõe os singletons corretos (`userRepository`, `accountRepository`, `hasher`, `mailer`) sem acoplamento direto ao Prisma nas camadas superiores.
- O route handler força `export const runtime = "nodejs"` antes dos imports, necessário para o binding nativo do argon2.
- Fronteiras de camada respeitadas: `nextauth.config.ts` importa de `infrastructure/container` (infra→infra: permitido); nenhum arquivo de `application/` importa de `infrastructure/`.
- `npm run lint`, `npm test` (277/277) e `npm run build` passam sem erros.
- Os dois achados são de baixa severidade e não afetam correção funcional, segurança nem contratos para as fases seguintes.

## Required Actions Before Completion

Nenhuma ação obrigatória. Os achados L1 e L2 são recomendações opcionais para iterações futuras.

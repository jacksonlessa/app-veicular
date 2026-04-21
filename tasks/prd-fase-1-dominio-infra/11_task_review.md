# Task 11.0 Review — Validação manual: seed script e login funcional

## Verdict: APPROVED

## Findings

### Critical

Nenhum.

### High

Nenhum.

### Medium

**[M1] `seed-dev.ts` instancia `PrismaClient` diretamente em vez de usar o singleton da infraestrutura**

O esqueleto da tarefa (e o TechSpec) prevê `import { prisma } from "@/infrastructure/database/prisma.client"`. A implementação usa `new PrismaClient()` diretamente do pacote `@prisma/client`. Para um script de dev executado fora do runtime do Next.js isso é funcional (não há risco de múltiplas conexões em produção), mas viola a convenção estabelecida de centralizar o singleton. Se o `prisma.client.ts` adicionar logs ou parâmetros customizados no futuro, o seed não os herdará.

Caminho: `scripts/seed-dev.ts:4`

### Low

**[L1] Subtarefa 11.6 menciona `boundaries/element-types`, mas a regra ativa é `boundaries/dependencies`**

A tarefa diz "Promover regra `boundaries/element-types` de `warn` para `error`". Na prática, o `eslint.config.mjs` usa a regra `boundaries/dependencies` — que é a regra correta do `eslint-plugin-boundaries` para controle de imports entre camadas. Além disso, essa regra já estava configurada como `error` desde a task 1 (commit `5dbaa84`), portanto não havia promoção a fazer. O resultado final (boundaries como `error`) está correto; apenas a nomenclatura na descrição da subtarefa é imprecisa.

**[L2] `console.log` exibe a senha em claro**

O TechSpec (seção Considerações Técnicas) define "senhas nunca aparecem em logs". A linha `console.log(`seeded: ${email} / ${password}`)` expõe a senha em texto claro no terminal. A tarefa permite explicitamente esse comportamento para scripts de dev e o esqueleto da task reproduz essa linha, portanto está dentro do escopo acordado. Vale registrar que, se `SEED_PASSWORD` for uma senha de ambiente real (ex.: staging), ela ficará exposta no histórico de terminal e em logs de CI.

Recomendação futura (não bloqueante): logar apenas `seeded: ${email}` e emitir um aviso separado sobre a senha padrão usada.

**[L3] Acentos ausentes no README (encoding)**

Textos como "O script e idempotente", "variaveis de ambiente" e "Descricao" aparecem sem acentos. Isso é esteticamente incorreto mas não afeta funcionalidade. Pode ser resultado de limitação de encoding no ambiente de escrita.

## Summary

A implementação cobre integralmente os requisitos da task 11.0:

- `scripts/seed-dev.ts` é idempotente via `upsert`, usa `Argon2PasswordHasher`, e aceita `SEED_EMAIL`/`SEED_PASSWORD` via env.
- `package.json` inclui `"seed:dev": "tsx scripts/seed-dev.ts"` e `tsx` como devDependency.
- O README documenta seed, obtenção de CSRF token, curl de login e verificação de sessão com `accountId`.
- `eslint-plugin-boundaries` está ativo com regra `error` — verificado via `eslint --print-config`.
- O script foi executado com sucesso e é idempotente (confirmado ao rodar duas vezes consecutivas).
- `npm test` (277 passed), `npm run lint` (0 errors) e `npm run build` passam.

Os achados M1 e L1-L3 são observações sem impacto no funcionamento ponta-a-ponta desta fase.

## Required Actions Before Completion

Nenhuma ação bloqueante. O verdict é APPROVED.

Considerações opcionais para fases seguintes:
- Ajustar `seed-dev.ts` para importar o singleton `prisma` de `@/infrastructure/database/prisma.client` em vez de instanciar `PrismaClient` diretamente.
- Não logar a senha em scripts de CI/staging (trocar por aviso condicional).

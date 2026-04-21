# Task 3.0 Review — Account context: entities Account e User + repo interfaces

## Verdict: APPROVED

## Findings

### Critical

None.

### High

None.

### Medium

**M1 — `Account.create` não valida `id` vazio**
`Account.create({ id: "", name: "Foo" })` retorna uma `Account` com `id` em branco sem lançar erro. O mesmo ocorre em `User.create`. A task e o TechSpec não exigem validação explícita de `id` neste método (o ID é gerado externamente), mas a ausência de qualquer guarda deixa uma brecha silenciosa quando chamado incorretamente.
Severidade: Medium — risco de persistir registros sem PK legível se o caller errar; mitigável na task 9.0 (repositório Prisma usará Prisma como gerador de ID).

**M2 — `User.create` não valida `accountId` vazio**
Análogo ao ponto anterior: `User.create({ ..., accountId: "" })` é aceito silenciosamente. O vinculo `User→Account` é estrutural e um `accountId` vazio quebraria a FK. Baixo risco agora (a infra não existe nesta task), mas pode mascarar bugs em Fase 2.

### Low

**L1 — Ausência de teste para `accountId` vazio em `User.create`**
O conjunto de testes de `user.entity.test.ts` cobre `name` vazio e `passwordHash` vazio, mas não cobre `accountId: ""`. A cobertura de linhas permanece em 100% porque não há guarda para esse caso, mas a invariante de integridade referencial fica sem exercício.

**L2 — `UserProps` e `AccountProps` são interfaces `export`adas sem necessidade de exportação**
Ambas as interfaces de props são `export`adas (`export interface AccountProps`, `export interface UserProps`). Como são apenas tipos internos à entity — usados exclusivamente pelo factory `rehydrate` —, exportá-los aumenta a superfície pública do módulo e pode ser interpretado como convite a acessá-los externamente. Sem impacto funcional agora, mas pode gerar acoplamento indesejado em Fase 2.

**L3 — `AccountRepository` não reexporta o tipo `Account`**
`account.repository.ts` usa `import type { Account }` (correto), mas um consumidor que importe apenas `AccountRepository` precisará importar `Account` separadamente. Esse padrão é consistente com o restante do projeto e foi adotado deliberadamente, mas merece registro para que fases futuras mantenham a convenção.

## Summary

A implementação está completa e correta em relação a todos os critérios obrigatórios da task 3.0. Todas as 6 subtarefas foram concluídas: as entities `Account` e `User` implementam os padrões `create` / `rehydrate` conforme o TechSpec; as interfaces `AccountRepository` e `UserRepository` declaram exatamente os métodos necessários para a Fase 2 (`findById`, `create`, `findByEmail`) sem sobrecarga; os repositórios são zero-runtime (apenas interfaces TypeScript); e os 17 testes cobrem caminho feliz, entradas inválidas e comportamento de `rehydrate` sem revalidação.

A arquitetura segue a estrutura por contexto definida no TechSpec (`src/domain/account/`), os erros de domínio são lançados corretamente via `InvalidValueError`, e não há imports de camadas externas (infrastructure ou application) em nenhum arquivo de `domain/account/`. A conformidade com Clean DDD é mantida.

Os pontos levantados são de baixo risco e todos endereçáveis de forma incremental nas tasks subsequentes (principalmente task 9.0 ao implementar os repositórios Prisma). Nenhum deles bloqueia a Fase 2.

## Required Actions Before Completion

Nenhuma ação bloqueante. Os itens Medium e Low abaixo são recomendações para tasks futuras:

- (Recomendação — task 9.0) Avaliar adicionar guarda de `id` não-vazio em `Account.create` e `User.create`, ou documentar explicitamente que a geração de ID é responsabilidade do caller.
- (Recomendação — task 9.0) Adicionar teste para `accountId: ""` em `user.entity.test.ts` caso a guarda seja implementada.
- (Recomendação — refactor futuro) Considerar tornar `AccountProps` e `UserProps` tipos privados (não exportados) para reduzir superfície pública.

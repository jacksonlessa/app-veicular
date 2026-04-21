---
status: completed
parallelizable: false
blocked_by: ["3.0", "4.0", "5.0", "7.0"]
---

<task_context>
<domain>infra/database</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 9.0: Repositórios Prisma (Account/User completos, demais com stubs)

## Visão Geral

Implementar as classes Prisma que satisfazem os contratos do domínio. `Account` e `User` com métodos completos (consumidos pela Fase 2 auth). `Vehicle`, `Fuelup` e `Maintenance` como classes criadas com assinatura completa, mas apenas os métodos estritamente necessários implementados — demais lançam `NotImplementedError` e serão completados nas fases 3/4/5.

<requirements>
- `prisma-account.repository.ts` implementa `AccountRepository` completo
- `prisma-user.repository.ts` implementa `UserRepository` completo (inclui `findByEmail`)
- `prisma-vehicle.repository.ts`, `prisma-fuelup.repository.ts`, `prisma-maintenance.repository.ts` criados com `findById` (se necessário) e demais lançando `NotImplementedError`
- Funções locais `toEntity(row)` / `toPersistence(entity)` em cada arquivo — sem adapter global
- Tradução de `P2002` (unique constraint) → `BusinessRuleError("email.duplicate")` em `prisma-user.repository.ts`
- Testes de mapeadores (POJO round-trip) sem tocar no DB
- `NotImplementedError` definido em `src/infrastructure/errors/`
</requirements>

## Subtarefas

- [x] 9.1 Criar `src/infrastructure/errors/not-implemented.error.ts`
- [x] 9.2 Criar `src/infrastructure/database/repositories/prisma-account.repository.ts` + mapeadores + teste
- [x] 9.3 Criar `src/infrastructure/database/repositories/prisma-user.repository.ts` + mapeadores + teste (inclui tradução de P2002)
- [x] 9.4 Criar stubs `prisma-vehicle.repository.ts`, `prisma-fuelup.repository.ts`, `prisma-maintenance.repository.ts`
- [x] 9.5 Criar testes de round-trip de mapeadores em `tests/unit/infrastructure/database/`
- [x] 9.6 Rodar `npm test` e `npm run lint`

## Detalhes de Implementação

Cada repositório recebe `prisma` no construtor (DI simples):

```ts
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email: email.value } });
    return row ? toEntity(row) : null;
  }

  async create(user: User): Promise<User> {
    try {
      const row = await this.prisma.user.create({ data: toPersistence(user) });
      return toEntity(row);
    } catch (e: any) {
      if (e?.code === "P2002") throw new BusinessRuleError("email.duplicate");
      throw e;
    }
  }
}

function toEntity(row: PrismaUser): User {
  return User.rehydrate({
    id: row.id, accountId: row.accountId, name: row.name,
    email: Email.create(row.email), passwordHash: row.passwordHash,
    createdAt: row.createdAt,
  });
}
```

Testes de mapeadores exportam `toEntity`/`toPersistence` (ou deixam-nas em módulo dedicado `*.mapper.ts`) e testam com POJO — sem spinning up Prisma.

## Critérios de Sucesso

- `prisma-account.repository.ts` e `prisma-user.repository.ts` 100% funcionais
- Stubs lançam `NotImplementedError` com mensagem clara indicando a fase responsável
- Round-trip `toPersistence(toEntity(row)) === row` (campos equivalentes) passa em teste
- Tentar criar dois `User` com mesmo email via mock simulando `P2002` lança `BusinessRuleError("email.duplicate")`
- `npm run lint` passa — repositórios importam `domain/` apenas (boundaries OK)

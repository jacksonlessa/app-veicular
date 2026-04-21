---
status: completed
parallelizable: true
blocked_by: ["2.0"]
---

<task_context>
<domain>back/domain/account</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 3.0: Account context — entities Account e User + repo interfaces

## Visão Geral

Modelar o contexto de conta/usuário: entities `Account` e `User` (consumindo o VO `Email`) e os contratos `AccountRepository` e `UserRepository` com apenas os métodos necessários à Fase 2 (auth).

<requirements>
- `Account` entity com `id`, `name`, `createdAt`
- `User` entity com `id`, `accountId`, `name`, `email: Email`, `passwordHash`, `createdAt`
- Factories `create(input)` (valida) e `rehydrate(props)` (sem revalidar — uso em repos)
- `AccountRepository`: `findById`, `create`
- `UserRepository`: `findByEmail(email: Email)`, `findById`, `create`
- Testes para as factories e qualquer regra de entity
</requirements>

## Subtarefas

- [x] 3.1 Criar `src/domain/account/entities/account.entity.ts`
- [x] 3.2 Criar `src/domain/account/entities/user.entity.ts`
- [x] 3.3 Criar `src/domain/account/repositories/account.repository.ts`
- [x] 3.4 Criar `src/domain/account/repositories/user.repository.ts`
- [x] 3.5 Criar testes em `tests/unit/domain/account/` para factories e invariantes
- [x] 3.6 Rodar `npm test` e `npm run lint`

## Detalhes de Implementação

```ts
// user.entity.ts
export interface UserProps { id: string; accountId: string; name: string; email: Email; passwordHash: string; createdAt: Date; }
export class User {
  private constructor(private props: UserProps) {}
  static create(input: { id: string; accountId: string; name: string; email: Email; passwordHash: string; }): User {
    if (!input.name?.trim()) throw new InvalidValueError("User.name", input.name);
    if (!input.passwordHash) throw new InvalidValueError("User.passwordHash", "empty");
    return new User({ ...input, createdAt: new Date() });
  }
  static rehydrate(props: UserProps): User { return new User(props); }
  get id() { return this.props.id; }
  get email() { return this.props.email; }
  get accountId() { return this.props.accountId; }
  get passwordHash() { return this.props.passwordHash; }
  get name() { return this.props.name; }
  get createdAt() { return this.props.createdAt; }
}
```

Repositórios são apenas interfaces TypeScript. A assinatura completa (para guiar fases futuras) pode ser declarada, mas a implementação fica na Task 9.0.

## Critérios de Sucesso

- `User.create` rejeita `name` vazio e `passwordHash` vazio
- `User.rehydrate` não revalida (usado quando row do banco tem campos já persistidos)
- `AccountRepository` e `UserRepository` exportam apenas tipos/interfaces (zero runtime)
- Testes passam; cobertura ≥ 90% em `src/domain/account/`

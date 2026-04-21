---
status: completed
parallelizable: true
blocked_by: ["1.0", "3.0"]
---

<task_context>
<domain>back/application/account</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 6.0: RegisterAccountUseCase + teste

## Visão Geral

Use case de auto-registro: cria uma nova `Account` e o primeiro `User` vinculado, atomicamente. Invocado pela rota `POST /api/auth/register`.

<requirements>
- Valida email via VO, senha com mínimo 8 caracteres
- Falha com `BusinessRuleError("email.duplicate")` se e-mail já existe
- Transação Prisma garante atomicidade de Account + User
- Senha armazenada como hash Argon2 (via `PasswordHasher`)
- Retorna `{ userId, accountId }`
- Testes com fakes em memória para `UserRepository` e `AccountRepository`
</requirements>

## Subtarefas

- [ ] 6.1 Criar `src/application/usecases/account/register-account.usecase.ts`
- [ ] 6.2 Constante `MIN_PASSWORD_LEN = 8` em `src/application/usecases/account/constants.ts`
- [ ] 6.3 Implementar `execute` com validação + transação
- [ ] 6.4 Criar teste `tests/unit/application/usecases/account/register-account.usecase.test.ts` com fakes
- [ ] 6.5 Rodar `npm test` e `npm run lint`

## Detalhes de Implementação

```ts
async execute(input: { name; email; password }) {
  const email = Email.create(input.email);
  if (input.password.length < MIN_PASSWORD_LEN)
    throw new InvalidValueError("password", "<min>");
  if (await this.users.findByEmail(email))
    throw new BusinessRuleError("email.duplicate");
  const passwordHash = await this.hasher.hash(input.password);

  return this.prisma.$transaction(async (tx) => {
    const accountId = createId();   // cuid via @paralleldrive/cuid2 OU Prisma default no insert
    const account = Account.create({ id: accountId, name: input.name });
    await this.accounts.create(account);            // TODO: aceitar tx
    const user = User.create({ id: createId(), accountId, name: input.name, email, passwordHash });
    await this.users.create(user);                  // TODO: aceitar tx
    return { userId: user.id, accountId };
  });
}
```

**Nota sobre transação:** como os repos atuais não aceitam `tx` como parâmetro, a forma mais simples nessa task é receber `prisma: PrismaClient` no construtor e usar `prisma.$transaction` diretamente com operações Prisma brutas _dentro do use case_ — aceitável como compromisso MVP, explicado no TechSpec. Alternativa: estender os repos com `create(entity, tx?)` e passar `tx`. Escolher a primeira opção para agilidade; refactor futuro fica como débito técnico documentado.

Para gerar ids independentes do Prisma (necessário para montar a entidade antes do insert), usar `createId()` do pacote `cuid` — como o Prisma já gera cuid via `@default(cuid())`, outra opção é deixar o Prisma gerar e apenas rehidratar depois. Decidir e documentar no review.

## Critérios de Sucesso

- Email duplicado → `BusinessRuleError("email.duplicate")`.
- Senha curta → `InvalidValueError`.
- Sucesso retorna ids não vazios; `users.findByEmail` encontra o novo usuário.
- Lint + testes verdes.

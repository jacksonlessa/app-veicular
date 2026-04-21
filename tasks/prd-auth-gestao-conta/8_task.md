---
status: completed
parallelizable: true
blocked_by: ["2.0", "3.0"]
---

<task_context>
<domain>back/application/account</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 8.0: AcceptInviteUseCase + teste

## Visão Geral

Use case invocado quando o convidado submete o formulário em `/convite/[token]`. Valida token, confirma que o convite ainda é usável, impõe o limite de 2 usuários e cria o novo `User` na conta do invite, marcando o convite como `accepted` em uma única transação.

<requirements>
- Valida token via VO
- `invite.not_found` quando não existe
- `invite.expired_or_used` quando `!isUsable(now)`
- `invite.account_full` se a conta já tem 2 usuários (defesa contra race)
- Senha mínima 8 caracteres
- Cria usuário + marca invite `accepted` atomicamente
- Retorna `{ userId, accountId }`
- Testes com fakes cobrindo todos os erros + sucesso
</requirements>

## Subtarefas

- [ ] 8.1 Criar `src/application/usecases/account/accept-invite.usecase.ts`
- [ ] 8.2 Construtor recebe deps: `invites`, `users`, `hasher`, `prisma`
- [ ] 8.3 Implementar `execute({ token, name, password })`
- [ ] 8.4 Criar teste `tests/unit/application/usecases/account/accept-invite.usecase.test.ts`
- [ ] 8.5 Rodar `npm test` e `npm run lint`

## Detalhes de Implementação

```ts
async execute({ token, name, password }) {
  const t = InviteToken.create(token);
  const invite = await this.invites.findByToken(t);
  if (!invite) throw new BusinessRuleError("invite.not_found");
  if (!invite.isUsable(new Date())) throw new BusinessRuleError("invite.expired_or_used");
  if (password.length < MIN_PASSWORD_LEN) throw new InvalidValueError("password", "<min>");
  if (await this.users.countByAccount(invite.accountId) >= 2)
    throw new BusinessRuleError("invite.account_full");

  const passwordHash = await this.hasher.hash(password);
  return this.prisma.$transaction(async (tx) => {
    const user = User.create({ id: createId(), accountId: invite.accountId, name, email: invite.email, passwordHash });
    await this.users.create(user);
    invite.markAccepted();
    await this.invites.update(invite);
    return { userId: user.id, accountId: invite.accountId };
  });
}
```

## Critérios de Sucesso

- Token inexistente / expirado / já aceito → `BusinessRuleError` com code correto.
- Conta cheia → `BusinessRuleError("invite.account_full")`.
- Sucesso: usuário criado + invite marcado `accepted`.
- Lint + testes verdes.

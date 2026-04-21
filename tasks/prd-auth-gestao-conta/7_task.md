---
status: completed
parallelizable: true
blocked_by: ["2.0", "3.0", "4.0"]
---

<task_context>
<domain>back/application/account</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 7.0: InviteUserUseCase + teste

## Visão Geral

Use case que um usuário autenticado executa para convidar outra pessoa para sua conta. Aplica as regras de negócio (limite de 2 users/conta, e-mail não duplicado, sem convite pendente duplicado), gera token via `TokenGenerator`, persiste o `Invite` e dispara o envio de e-mail via `Mailer`.

<requirements>
- Valida email (VO)
- `users.countByAccount >= 2` → `BusinessRuleError("invite.account_full")`
- `users.findByEmail` na mesma conta → `BusinessRuleError("invite.already_member")`
- Usuário em outra conta → `BusinessRuleError("invite.email_in_use")`
- `invites.findActivePending` retorna invite → `BusinessRuleError("invite.already_pending")`
- Gera token, cria `Invite` (ttl 48h), persiste, envia e-mail
- Testes com fakes cobrindo os 4 caminhos de erro + caminho feliz
</requirements>

## Subtarefas

- [ ] 7.1 Criar `src/application/usecases/account/invite-user.usecase.ts`
- [ ] 7.2 Constante `INVITE_TTL_HOURS = 48`
- [ ] 7.3 Construtor recebe deps: `users`, `accounts`, `invites`, `mailer`, `tokenGenerator`, `baseUrl`
- [ ] 7.4 Implementar `execute({ accountId, inviterUserId, email })`
- [ ] 7.5 Criar teste `tests/unit/application/usecases/account/invite-user.usecase.test.ts`
- [ ] 7.6 Rodar `npm test` e `npm run lint`

## Detalhes de Implementação

Após criar o invite, chamar `mailer.sendInvite({ to: email, inviterName, accountName, acceptUrl: ${baseUrl}/convite/${token} })`. Buscar `inviterName` via `users.findById(inviterUserId)` e `accountName` via `accounts.findById(accountId)`.

Ordem dos checks: validação VO → conta (para obter accountName) → countByAccount → findByEmail → findActivePending → cria invite → persist → send.

No teste, usar um `FakeMailer` que captura o payload e verificar `acceptUrl` exato.

## Critérios de Sucesso

- Caminho feliz: retorna `{ inviteId }`, `invites.create` chamado, `mailer.sendInvite` chamado com `acceptUrl` contendo o token gerado.
- Cada um dos 4 erros lança `BusinessRuleError` com code correto e **não** chama `mailer.sendInvite`.
- Lint + testes verdes.

# Task 8.0 Review — AcceptInviteUseCase

## Verdict: CHANGES REQUIRED

## Findings

### Critical

Nenhum finding crítico. O finding [C1] da review anterior foi resolvido.

### High

Nenhum finding de alta severidade. Os findings [H1] e [H2] da review anterior foram resolvidos.

### Medium

**[M1] Ordem das validações ainda diverge do TechSpec — remanescente da review anterior**

O TechSpec especifica a ordem: `isUsable` → `countByAccount` → validar senha. A implementação atual (linhas 36-43 de `accept-invite.usecase.ts`) valida a senha **antes** de verificar `countByAccount`:

```ts
if (!invite.isUsable(new Date())) throw ...   // correto
if (input.password.length < MIN_PASSWORD_LEN) throw ...   // senha antes de countByAccount
if ((await this.users.countByAccount(invite.accountId)) >= 2) throw ...
```

O TechSpec exige `countByAccount` antes de validar senha. Com a ordem errada, um usuário que submete senha curta em um convite de conta já cheia recebe `InvalidValueError("password")` em vez de `BusinessRuleError("invite.account_full")`. A mensagem de erro no cliente seria incorreta. Este finding foi explicitamente listado como "Required Action" (M1) na review anterior e não foi corrigido.

**Ação requerida:** Mover a verificação `countByAccount` para antes de `password.length < MIN_PASSWORD_LEN`.

**[M2] `FakeUserRepository.countByAccount` não aceita o parâmetro `accountId` — falha na implementação da interface**

O método na interface do repositório é `countByAccount(accountId: string): Promise<number>`. O `FakeUserRepository` em `accept-invite.usecase.test.ts` (linha 87) declara:

```ts
async countByAccount(): Promise<number> {
  return this.store.length;
}
```

O parâmetro `accountId` está ausente, o que viola a assinatura da interface. O TypeScript com `implements UserRepository` deveria rejeitar isso (parâmetro omitido é estruturalmente compatível em TypeScript, mas o body não filtra por `accountId`). Funcionalmente, todos os itens do `store` pertencem a `ACCOUNT_ID`, então os testes atuais passam — mas em qualquer cenário com múltiplas contas, `countByAccount` retornaria a contagem global, mascarando bugs silenciosamente.

Este finding ([M2] da review anterior) foi listado como "Required Action" e não foi corrigido.

**Ação requerida:** Corrigir a assinatura e o body: `async countByAccount(accountId: string): Promise<number> { return this.store.filter(u => u.accountId === accountId).length; }`

### Low

**[L1] `markAccepted()` da entidade `Invite` não é chamado — bypass do guard do domínio**

A implementação nova usa operações brutas `tx.invite.update({ data: { status: "accepted" } })` dentro do `$transaction`, o que é o padrão correto para o MVP com repos sem suporte a `TransactionClient`. Porém, a chamada a `invite.markAccepted()` foi completamente removida, sem que o guard de domínio seja executado em nenhum ponto. O guard (`isUsable` já verificado antes da transação) é redundante, mas a ausência de `markAccepted()` cria uma divergência entre o estado em memória do objeto `Invite` (ainda `pending`) e o banco (`accepted`). Em um cenário onde o objeto `invite` for reutilizado após `execute` (ex.: para compor uma resposta), o estado stale pode causar confusão. Considerado Low porque não impacta a correctitude do use case atual.

**[L2] Teste "marks the invite as accepted via prisma transaction" verifica `_status` não-público**

O fake de `tx.invite.update` usa `Object.assign(invite, { _status: data.status })` para marcar a aceitação (linha 121). O teste então verifica `(stored[0] as unknown as { _status: string })._status`. Isso é um artefato do fake — a propriedade `_status` não existe na entidade real. O assert é frágil: testa o mecanismo interno do fake em vez do comportamento observável. Seria mais robusto verificar que `userRepo.getStored()` tem o novo usuário (já coberto por outro teste) e que a chamada de update foi feita — ou usar um spy. Baixo impacto para o MVP.

## Summary

As duas correções críticas e ambas as de alta severidade exigidas pela review anterior foram implementadas corretamente:

1. **Atomicidade**: `prisma.$transaction` com `tx.user.create` e `tx.invite.update` é usado. `PrismaClient` é injetado no construtor conforme o TechSpec.
2. **Fronteira arquitetural**: `PasswordHasher` agora é importado de `@/application/ports/password-hasher`.
3. **`buildFakePrisma`**: os testes fazem write-through correto para os stores dos fakes, permitindo asserts sobre o estado final.

Porém, dois findings de média severidade listados como "Required Actions" na review anterior permanecem em aberto:

- **[M1]**: A ordem de validação ainda diverge do TechSpec (senha antes de `countByAccount`), resultando em mensagem de erro incorreta para o usuário no cenário de conta cheia + senha curta.
- **[M2]**: `FakeUserRepository.countByAccount` não aceita `accountId` e não filtra por conta, violando o contrato da interface e tornando testes futuros silenciosamente incorretos.

## Required Actions Before Completion

1. **[M1]** Reordenar validações em `accept-invite.usecase.ts`: `isUsable` → `countByAccount` → `password.length < MIN_PASSWORD_LEN`.
2. **[M2]** Corrigir `FakeUserRepository.countByAccount` no arquivo de teste para aceitar e filtrar por `accountId`: `async countByAccount(accountId: string) { return this.store.filter(u => u.accountId === accountId).length; }`

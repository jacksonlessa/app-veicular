# Task 8.0 Review — AcceptInviteUseCase

## Verdict: CHANGES REQUIRED

## Findings

### Critical

**[C1] Ausência de atomicidade: `users.create` e `invites.update` executados fora de transação**

O TechSpec especifica explicitamente: "prisma.$transaction: cria User com a accountId do invite + invite.markAccepted() + update". A task recebe `prisma: PrismaClient` no construtor, mas a implementação atual não recebe nem usa `PrismaClient` — o construtor declara apenas `(invites, users, hasher)`. Se `users.create` tiver sucesso mas `invites.update` falhar, o convite permanecerá como `pending` e poderá ser usado novamente, criando um segundo usuário na conta e violando o limite de 2 usuários. Este é um requisito explícito de atomicidade presente tanto no TechSpec quanto na task.

**Ação requerida:** Adicionar `prisma: PrismaClient` ao construtor e envolver `users.create` + `invite.markAccepted()` + `invites.update` em `this.prisma.$transaction`, usando operações brutas de Prisma dentro do callback (mesmo padrão da task 6).

### High

**[H1] Importação de `PasswordHasher` viola a fronteira arquitetural**

`accept-invite.usecase.ts` importa `PasswordHasher` de `@/infrastructure/auth/password-hasher`. Camada `application/` não deve depender de `infrastructure/`. A interface `PasswordHasher` deve residir em `src/application/ports/password-hasher.ts`. O mesmo problema existe na task 6 e é transversal.

**Ação requerida:** Ajustar import para `@/application/ports/password-hasher` após mover/criar o port.

**[H2] `invite.markAccepted()` é chamado fora da transação e pode lançar `BusinessRuleError` inesperadamente**

A lógica do use case valida `invite.isUsable(now)` antes de prosseguir, mas `invite.markAccepted()` (na entidade) também valida `isUsable` internamente e lança `BusinessRuleError("invite.expired_or_used")` se o estado não for usável. Como há uma janela de tempo entre a verificação `isUsable` e a chamada `markAccepted` (especialmente relevante quando a transação for implementada), e como a data passada para `markAccepted` usa `new Date()` por default, o comportamento é correto — mas a redundância pode causar confusão. Mais importante: atualmente `markAccepted()` é chamado após `users.create` sem transação, então uma eventual exceção interna da entidade não desfaz a criação do usuário.

### Medium

**[M1] Ordem das validações diverge do TechSpec**

O TechSpec especifica a ordem: token VO → findByToken → isUsable → countByAccount → validar senha → transação. A implementação valida a senha (`password.length < MIN_PASSWORD_LEN`) antes de verificar `countByAccount`. Embora funcional, a inversão significa que um convite pode ser rejeitado por senha curta mesmo quando a conta já estaria cheia — a mensagem de erro para o usuário seria incorreta. O TechSpec especifica `countByAccount` antes da validação de senha, e a task reproduz a mesma ordem. Inconsistência de prioridade de erro.

**Ação requerida (Medium):** Reordenar para: `isUsable` → `countByAccount` → `password.length`.

**[M2] `FakeUserRepository.countByAccount` ignora o `accountId` e retorna comprimento global do store**

O método `countByAccount()` no fake do teste não filtra por `accountId` — retorna sempre `this.store.length`. Isso funciona nos testes atuais porque todos os usuários no store pertencem ao mesmo `ACCOUNT_ID`, mas tornaria testes futuros de múltiplas contas silenciosamente incorretos.

**Ação requerida (Medium):** Corrigir `FakeUserRepository.countByAccount` para filtrar por `accountId`.

### Low

**[L1] `beforeEach` no describe "when all inputs are valid" cria repos que nunca são usados**

O `beforeEach` captura `{ inviteRepo, userRepo }` mas os testes dentro do describe constroem instâncias próprias localmente (padrão repetido em todos os `it` do grupo). O `beforeEach` e as variáveis `inviteRepo`/`userRepo` declaradas no escopo do `describe` são código morto.

**[L2] `FakeUserRepository` nos testes de task 8 não recebe `PrismaClient` no construtor do `AcceptInviteUseCase`**

Consequência direta de [C1]: como o construtor atual não declara `prisma`, os testes existentes não passam `PrismaClient` fake. Após a correção de [C1], os testes precisarão ser atualizados para incluir um stub de `PrismaClient`.

## Summary

A task tem boa cobertura de testes e implementa corretamente todas as validações de negócio (token não encontrado, expirado/usado, conta cheia, senha curta). Porém, o requisito central de atomicidade — explicitamente presente no TechSpec e na task — não foi implementado: `users.create` e `invites.update` ocorrem sequencialmente sem `$transaction`, com risco real de estado inconsistente (convite `pending` com usuário já criado). Adicionalmente, a fronteira arquitetural `application/ → infrastructure/` é violada pelo import de `PasswordHasher`. Ambos são bloqueadores.

## Required Actions Before Completion

1. **[C1]** Adicionar `prisma: PrismaClient` ao construtor e envolver `users.create` + `markAccepted` + `invites.update` em `this.prisma.$transaction` com operações brutas.
2. **[H1]** Corrigir import de `PasswordHasher` para `@/application/ports/password-hasher` (transversal com task 6).
3. **[M1]** Reordenar validações: `isUsable` → `countByAccount` → senha.
4. **[M2]** Corrigir `FakeUserRepository.countByAccount` para filtrar por `accountId`.
5. **[L1]** Remover `beforeEach` e variáveis mortas no describe "when all inputs are valid".

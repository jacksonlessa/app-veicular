# Task 6.0 Review — RegisterAccountUseCase

## Verdict: CHANGES REQUIRED

## Findings

### Critical

**[C1] Ausência de atomicidade: Account e User são persistidos fora de uma transação**

O TechSpec é explícito: "Transação Prisma garante atomicidade de Account + User" e o requisito da task afirma o mesmo. A implementação recebe `PrismaClient` como dependência, mas não o utiliza — `accounts.create` e `users.create` são chamados sequencialmente fora de `prisma.$transaction`. O comentário inline reconhece o problema como débito técnico, mas o TechSpec autoriza explicitamente a abordagem de "operações Prisma brutas dentro do use case" como alternativa aceitável para MVP. A implementação sequer adota essa alternativa — ela apenas ignora a transação por completo. Se `users.create` falhar após `accounts.create` ter concluído, a conta ficará orfã no banco. Este é o critério de sucesso mais crítico da task e não foi atendido.

**Ação requerida:** Envolver `accounts.create` e `users.create` em `this._prisma.$transaction(async (tx) => { ... })`. Como os repositórios não aceitam `tx` ainda, usar operações Prisma brutas dentro do callback, conforme descrito no TechSpec (seção "Nota sobre transação" da task).

### High

**[H1] Importação de `PasswordHasher` viola a fronteira arquitetural**

`register-account.usecase.ts` importa `PasswordHasher` de `@/infrastructure/auth/password-hasher`. A camada `application/` não deve depender de `infrastructure/` — apenas de `domain/` e `ports/`. O type `PasswordHasher` deve ser importado de um port em `application/ports/password-hasher.ts` (conforme o arquivo `.tmp` presente no git status confirma que já existia ou estava em criação). Isso quebra a regra `eslint-plugin-boundaries` descrita no TechSpec.

**Ação requerida:** Mover a interface `PasswordHasher` para `src/application/ports/password-hasher.ts` (ou reutilizar se já existir) e ajustar o import no use case e nos testes.

**[H2] O mesmo problema de importação ocorre em `accept-invite.usecase.ts` (task 8)**

Mesmo padrão: `PasswordHasher` importado de `infrastructure/`. Documentado aqui por ser detectado na revisão do contexto de task 6, mas o impacto se replica nas tasks 7 e 8 (ver seção correspondente).

### Medium

**[M1] `_prisma` recebido mas nunca usado — parâmetro de construtor sem efeito real**

O parâmetro `_prisma: PrismaClient` é suprimido com `eslint-disable-next-line @typescript-eslint/no-unused-vars`. Isso é um sinal de que o contrato do construtor declarado no TechSpec não foi implementado — o campo existe apenas para satisfazer a assinatura enquanto a lógica real permanece não-atômica. Se o débito técnico fosse aceitável como está, ao menos o parâmetro deveria ser documentado em um TODO rastreável (ticket/issue), não apenas em comentário inline.

**[M2] Teste usa cast direto `{ value: "..." } as Email` em vez de `Email.create`**

Os testes de `register-account.usecase.test.ts` constroem e-mails para busca usando `{ value: "maria@example.com" } as Email`. Isso contorna a normalização do VO e pode mascarar regressões caso a implementação de `Email` mude. Os testes devem usar `Email.create("maria@example.com")` para manter a consistência.

### Low

**[L1] Nome da conta sempre usa `input.name` do usuário, não há constante ou regra explícita**

O TechSpec menciona a decisão: "usar o nome do usuário registrado por default". A implementação segue isso corretamente, mas o comentário ou uma constante nomeada (`ACCOUNT_NAME_FROM_USER = input.name`) tornaria a intenção rastreável. Baixo impacto, sugestão de melhoria de legibilidade.

## Summary

A task possui uma implementação funcional para o caminho feliz e testes bem estruturados, mas falha no requisito central de atomicidade — que é explicitamente listado tanto na task quanto no TechSpec como obrigatório. Adicionalmente, a fronteira arquitetural `application/ → infrastructure/` é violada pela importação direta de `PasswordHasher` de `infrastructure/auth/`. Ambos os problemas são bloqueadores antes de marcar a task como completa.

## Required Actions Before Completion

1. **[C1]** Implementar `prisma.$transaction` usando operações brutas `tx.account.create` / `tx.user.create` dentro do callback, conforme descrito na task e no TechSpec.
2. **[H1]** Extrair / mover `PasswordHasher` para `src/application/ports/password-hasher.ts` e corrigir o import no use case e nos testes.
3. **[M2]** Substituir `{ value: "..." } as Email` por `Email.create("...")` nos testes.

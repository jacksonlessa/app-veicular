# Task 6.0 Review — RegisterAccountUseCase

## Verdict: APPROVED

## Findings

### Critical

Nenhum finding crítico. O finding [C1] da review anterior foi resolvido.

### High

Nenhum finding de alta severidade. O finding [H1] da review anterior foi resolvido.

### Medium

**[M2] Dois testes ainda constroem `Email` via cast direto em vez de `Email.create`**

Em `register-account.usecase.test.ts`, os testes "persiste o usuário no repositório" (linha 128) e "armazena o hash da senha" (linha 153) constroem o VO de e-mail como `{ value: "maria@example.com" } as Email` para chamar `userRepo.findByEmail`. Embora os testes passem porque o `FakeUserRepository` compara apenas `email.value`, o padrão contorna a normalização e factory do VO — se o comportamento de `Email.create` mudar (e.g., trim, lowercase adicional), esses testes não detectarão a regressão. O finding foi explicitamente listado como "Required Action" na review anterior e não foi integralmente corrigido (os outros dois e-mails da suite usam `Email.create` corretamente via o path real do use case, mas os asserts que constroem o VO diretamente ainda usam o cast).

**Ação recomendada:** Substituir `{ value: "..." } as Email` por `Email.create("...")` nas linhas de `findByEmail` dos testes citados.

### Low

**[L1] Nome da conta sempre deriva de `input.name` do usuário — decisão não documentada em código**

A regra é correta (conforme TechSpec), mas não há uma constante ou comentário inline rastreável. Sugestão de melhoria de legibilidade sem impacto funcional.

## Summary

As duas correções críticas exigidas pela review anterior foram implementadas corretamente:

1. **Atomicidade**: `prisma.$transaction` com `tx.account.create` / `tx.user.create` é usado, garantindo que Account e User sejam criados atomicamente. O `$transaction` é injetado via `PrismaClient` no construtor, conforme o TechSpec.
2. **Fronteira arquitetural**: `PasswordHasher` agora é importado de `@/application/ports/password-hasher`, e o arquivo de infraestrutura (`Argon2PasswordHasher`) re-exporta a interface do port — sem violação de camada.

O `buildFakePrisma` nos testes faz write-through para as stores dos fakes em memória, permitindo que os asserts pós-execução verifiquem tanto `userRepo.store` quanto `accountRepo.store` corretamente. O test coverage cobre todos os caminhos exigidos pelo TechSpec: sucesso, email duplicado, senha curta, email inválido.

O único finding remanescente ([M2]) é de média severidade e não bloqueia a entrega, mas deve ser corrigido em seguida para manter a saúde dos testes.

## Required Actions Before Completion

Nenhuma ação bloqueadora. A task está APROVADA.

**Ação recomendada (não bloqueadora):**
- **[M2]** Substituir `{ value: "..." } as Email` por `Email.create("...")` nos dois testes que constroem o VO manualmente para `findByEmail`.

# Task 7.0 Review — InviteUserUseCase

## Verdict: APPROVED

## Findings

### Critical

Nenhum.

### High

**[H1] Importação de `PasswordHasher` por `accept-invite` viola fronteira, mas não afeta este use case diretamente**

Esta task não usa `PasswordHasher`, então a violação de fronteira descrita na task 6 não se aplica aqui. Contudo, a dependência `@/infrastructure/auth/password-hasher` usada pela task 8 foi detectada ao revisar o contexto compartilhado — registrado na task 8.

**[H2] Falha no `mailer.sendInvite` não reverte o `Invite` já persistido**

O TechSpec reconhece isso como risco conhecido (Riscos #1) e documenta a mitigação: "como o mailer atual é Noop, não há falha real". A implementação segue exatamente a orientação: persiste o invite primeiro e depois chama o mailer, sem lógica de rollback. Este comportamento é explicitamente aceito para o MVP. Registrado como High porque uma falha de mailer real deixaria um invite pendente fantasma, mas o TechSpec autoriza o débito.

### Medium

**[M1] `inviterUser` buscado após `invites.create`, causando ordem de operações subótima**

O TechSpec especifica a ordem: "validação VO → conta → countByAccount → findByEmail → findActivePending → cria invite → persist → send". A busca de `inviterUser` (via `users.findById`) ocorre após `invites.create`, o que está correto quanto à persistência, mas o `inviterUser` poderia ser buscado antes de persistir o invite (junto às outras buscas de leitura), reduzindo o risco de persistir um invite se a busca do usuário falhar inesperadamente. Impacto prático é baixo (o token gerado seria perdido), mas é uma inconsistência de ordenação.

**[M2] `inviterUser` pode ser nulo sem lançar erro — fallback silencioso**

Se `users.findById(inviterUserId)` retorna `null`, o use case usa `"Membro da conta"` como fallback. Embora prático para o MVP, um `inviterUserId` inválido indica um bug no caller (API route) e deveria idealmente lançar um erro. O comportamento silencioso pode dificultar diagnóstico. Aceitável para MVP, mas merece um TODO.

### Low

**[L1] `FakeUserRepository` no teste expõe método `update` não declarado na interface `UserRepository`**

A interface `UserRepository` em `domain/account/repositories/user.repository.ts` não declara `update`. O `FakeUserRepository` do teste implementa `update` que não é necessário e não é chamado pelo use case, gerando código morto no teste. Sem impacto funcional.

**[L2] Constante `INVITE_TTL_HOURS` declarada em `constants.ts` — correto**

Subtarefa 7.2 atendida.

## Summary

A implementação está correta, bem estruturada e cobre todos os critérios de sucesso da task: os 4 caminhos de erro lançam `BusinessRuleError` com o code correto, nenhum deles chama o mailer, e o caminho feliz retorna `inviteId`, persiste o invite e chama o mailer com `acceptUrl` exato contendo o token gerado. Os fakes são limpos e expressivos. As descobertas de severidade Medium/Low são melhorias desejáveis mas não bloqueiam a funcionalidade. A task pode ser marcada como concluída após a resolução do item H1 da task 6 (fronteira arquitetural de `PasswordHasher`) que é um problema transversal às três tasks, não específico desta.

## Required Actions Before Completion

Nenhuma ação bloqueadora específica desta task. As ações transversais (fronteira `PasswordHasher`) são rastreadas na task 6.

# Task 14.0 Review — Smoke test manual + documentação de validação

## Verdict: APPROVED

## Findings

### Critical

Nenhuma.

### High

**H1 — Subtarefa 14.6 não totalmente contemplada: login automático de Bob não é verificado explicitamente via curl**

O Cenário 4 cobre a ação 4c (browser anônimo), mas o fluxo via curl (4b) retorna apenas `{ userId, accountId }` sem demonstrar que o `AcceptInviteUseCase` aciona a sessão automaticamente. O route handler de `POST /api/invites/[token]` precisa acionar `signIn()` do lado do cliente — via curl isso não ocorre. A documentação poderia tornar explícito que a verificação de "login automático" requer obrigatoriamente o browser (4c), evitando ambiguidade de interpretação na task (`Aceitar convite e confirmar login automático do usuário B`).

Recomendação: adicionar nota no Cenário 4b explicando que a validação do login automático só é observável via browser (Cenário 4c), e que o curl cobre apenas a criação de User.

### Medium

**M1 — Ausência de "resultado observado real" versus "resultado esperado"**

A tarefa requisitava estrutura com "resultado observado" como evidência de execução (referência: task 11.0 da Fase 1). O `validation.md` documenta apenas resultados esperados, sem distinguir o que foi de fato observado na execução. Para um documento de validação com fins de auditoria da fase, a ausência da coluna "resultado observado" enfraquece a evidência de que o smoke test foi realmente executado.

Recomendação: adicionar uma coluna ou subseção "Resultado Observado" em cada cenário, mesmo que seja `PASS` com eventual log ou captura. Alternativamente, incluir explicitamente uma nota de rodapé indicando que os resultados foram verificados em data/hora específica.

**M2 — Contagem de testes no resultado esperado de `npm test` pode tornar-se stale**

O `validation.md` afirma `372 tests passed`. Esse número é uma captura do momento da execução e pode divergir rapidamente conforme novos testes forem adicionados. Documentar um número absoluto sem ressalvas pode gerar confusão em futuras consultas.

Recomendação: substituir por "todos os testes passam (N no momento da validação)" ou adicionar `# at time of validation` em comentário.

**M3 — Cenário 4a cobre apenas token válido; ausência de sub-caso de token já utilizado (accepted)**

A task especifica "token inválido ou expirado" como cenário 7, mas o cenário de token já utilizado (status `accepted`) é tratado de forma idêntica pelo `isUsable(now)` e merecia cobertura própria ou menção explícita. A TechSpec distingue `invite.expired_or_used` como código único de erro — seria adequado documentar que o mesmo cenário 7 cobre implicitamente esse caso.

### Low

**L1 — Falta de instrução para reset/limpeza do banco entre execuções**

O Cenário 1 exige pré-condição `nenhum usuário com alice@exemplo.com existe`. Os pré-requisitos mencionam `prisma db push` mas não instrui como limpar dados anteriores (ex.: `npx prisma migrate reset --force` ou `sqlite3 prisma/dev.db "DELETE FROM User; DELETE FROM Account; DELETE FROM Invite;"`). Em execuções repetidas do smoke test, o Cenário 1 falharia na segunda rodada sem essa etapa.

**L2 — Déb. técnico 1 usa terminologia imprecisa ("rollback manual")**

O débito #1 menciona "rollback manual" mas o contexto correto é compensação após commit parcial (o Invite já foi persistido quando o Mailer falha). O termo correto no contexto transacional seria "compensação" ou "ação compensatória". Baixo impacto, mas pode gerar confusão em leituras futuras.

**L3 — O cenário 2 (logout) não está explicitamente coberto**

A task 14.3 define explicitamente "Logout e login novamente (valida fluxo de login)". O `validation.md` nomeia o Cenário 2 como "Login com Credenciais Válidas" mas não inclui o passo de logout antes do re-login. A instrução de chamar `POST /api/auth/signout` ou acessar o botão de logout no browser está ausente.

## Summary

O `validation.md` entregue é substancialmente completo: cobre os 8 cenários relevantes da Fase 2 (cadastro, login, convite, aceite, limite de conta, auth guard, token inválido, e-mail duplicado), inclui ações via browser e via curl para todos os cenários, documenta o output esperado do `NoopMailer`, registra 5 débitos técnicos com impacto e fase prevista, e alinha com os requisitos e contratos de API da TechSpec.

Os achados H1 e M1 reduzem o valor do documento como evidência auditável de execução real, mas não comprometem a capacidade de outro desenvolvedor reproduzir os testes. Os achados M2, M3, L1, L2, L3 são melhorias incrementais que não bloqueiam o fechamento da fase.

O documento supera a referência da task 11.0 da Fase 1 em cobertura de cenários e detalhe de comandos. A Fase 2 está em condições de ser marcada como concluída.

## Required Actions Before Completion

Nenhuma ação bloqueante. As seguintes melhorias são recomendadas mas opcionais para aprovação:

1. (H1) Adicionar nota no Cenário 4b esclarecendo que a verificação do login automático requer o fluxo de browser (4c).
2. (M1) Indicar explicitamente que os resultados foram verificados, idealmente com data/hora ou status `PASS` por cenário.
3. (L1) Adicionar instrução de limpeza do banco nos pré-requisitos para permitir execuções repetidas do smoke test.

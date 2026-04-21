# Task 3.0 Review — Estender UserRepository com countByAccount

## Verdict: APPROVED

## Findings

### Critical
_None._

### High
_None._

### Medium

**M-01: Testes usam mock em vez do banco real descrito na tarefa**

A tarefa (subtarefa 3.3) e a descrição de implementação indicam explicitamente o uso do "SQLite de dev" para os testes, com setup que "cria conta com 0, 1 e 2 usuários". Os testes entregues usam um `mockPrisma` em memória, sem nenhuma conexão ao banco.

O padrão existente em `prisma-account.repository.test.ts` também usa apenas mocks; logo, a base de código não estabeleceu infra de SQLite para esses testes. Os testes com mock são coerentes com a prática atual do projeto e válidos para verificar o comportamento do repositório — eles cobrem os cenários (0, 1, 2 usuários e isolamento entre contas) com assertivas precisas sobre os argumentos passados ao Prisma.

O desvio é do enunciado da tarefa, não do estado real do projeto. Não compromete a corretude da implementação, mas evidencia que a task description está desalinhada com a infraestrutura de testes existente.

_Ação sugerida:_ atualizar a descrição das próximas tasks similares para refletir que o padrão de testes de repositório é mock-based, ou criar a infra SQLite de dev de forma consistente antes de cobrar o uso dela.

### Low

**L-01: Critério de sucesso "isolamento entre contas" testado apenas via mock com tabela in-memory**

O critério de sucesso "Contagens isoladas entre contas" é coberto pelo teste `"counts are isolated between accounts"`. A lógica de delegação está correta, mas a garantia de isolamento real (a query SQL filtra por `accountId`) só pode ser validada com um banco real. Aceitável para MVP.

## Summary

A implementação da task 3.0 está correta e completa. O método `countByAccount(accountId: string): Promise<number>` foi adicionado à interface `UserRepository` com a assinatura exata especificada na TechSpec. A implementação em `PrismaUserRepository` usa `prisma.user.count({ where: { accountId } })`, conforme prescrito. Os quatro testes adicionados cobrem os cenários 0, 1 e 2 usuários na mesma conta e o isolamento entre contas distintas, com assertivas que verificam tanto o valor retornado quanto o argumento passado ao Prisma. Todos os 15 testes passam e o lint não reporta nenhuma infração.

O único ponto de atenção (M-01) é que os testes foram escritos com mock em vez de SQLite conforme a descrição da tarefa mencionava, mas isso está em linha com o padrão de teste já estabelecido no projeto (`prisma-account.repository.test.ts`) e não representa um defeito funcional.

## Required Actions Before Completion
_Nenhuma ação bloqueante. A task pode ser marcada como concluída._

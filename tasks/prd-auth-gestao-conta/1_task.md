---
status: completed
parallelizable: false
blocked_by: []
---

<task_context>
<domain>back/infra/setup</domain>
<type>configuration</type>
<scope>configuration</scope>
<complexity>low</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 1.0: Setup — zod e tipos de sessão do NextAuth

## Visão Geral

Preparar o terreno para a Fase 2 instalando `zod` (usado nas API routes para validação de input nos boundaries HTTP) e estendendo os tipos de sessão do NextAuth para expor `userId` além de `accountId` já presente. Essa task é pequena mas habilita todas as demais.

<requirements>
- `zod` instalado como dependência de produção
- Arquivo `src/types/next-auth.d.ts` declarando augmentations de `Session` e `JWT` com `accountId` e `userId`
- `nextauth.config.ts` atualizado para incluir `userId` nos callbacks `jwt` e `session`
- `npm run lint` e `npm test` passam sem erros
</requirements>

## Subtarefas

- [x] 1.1 `npm install zod`
- [x] 1.2 Criar `src/types/next-auth.d.ts` com `declare module "next-auth" { interface Session { accountId: string; userId: string; } }` e augmentation equivalente para `next-auth/jwt`
- [x] 1.3 Ajustar `src/infrastructure/auth/nextauth.config.ts` para propagar `user.id` e `accountId` no callback `jwt` e expô-los em `session`
- [x] 1.4 Garantir que `tsconfig.json` inclui `src/types/**/*.d.ts` (ajustar `include` se necessário)
- [x] 1.5 Rodar `npm run lint` e `npm test`

## Detalhes de Implementação

```ts
// src/types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session { accountId: string; userId: string; }
  interface User { id: string; accountId: string; email: string; }
}
declare module "next-auth/jwt" {
  interface JWT { accountId: string; userId: string; }
}
```

No callback `jwt`, ao logar pela primeira vez (`user` presente), copiar `user.id → token.userId` e `user.accountId → token.accountId`. Em `session`, copiar do token para `session.accountId` e `session.userId`.

## Critérios de Sucesso

- `getServerSession(authOptions)` retorna objeto com `accountId` e `userId` tipados.
- TypeScript reconhece `session.userId` sem casts em qualquer ponto do projeto.
- `npm test` permanece verde (sem impacto em testes existentes).

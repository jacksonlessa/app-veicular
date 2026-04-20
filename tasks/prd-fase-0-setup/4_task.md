---
status: completed
parallelizable: true
blocked_by: ["1.0", "2.0"]
---

<task_context>
<domain>back</domain>
<type>implementation</type>
<scope>configuration</scope>
<complexity>low</complexity>
<dependencies>http_server</dependencies>
</task_context>

# Tarefa 4.0: Scaffolding do NextAuth.js

## Visão Geral

Instalar NextAuth.js e criar o handler da rota `/api/auth/[...nextauth]` com `providers: []`. Nenhum fluxo funcional de autenticação — apenas scaffolding para evitar refactor de pastas na Fase 2.

<requirements>
- `next-auth` instalado
- Rota `src/app/api/auth/[...nextauth]/route.ts` criada
- Handler exporta GET e POST
- `GET /api/auth/session` responde 200 (não 500)
</requirements>

## Subtarefas

- [x] 4.1 `npm i next-auth`
- [x] 4.2 Criar `src/app/api/auth/[...nextauth]/route.ts`
- [x] 4.3 Validar resposta em `http://localhost:3000/api/auth/session`

## Detalhes de Implementação

```typescript
import NextAuth from "next-auth";

const handler = NextAuth({ providers: [] });
export { handler as GET, handler as POST };
```

Providers reais (Credentials + sessão com `account_id`) serão configurados na Fase 2.

## Critérios de Sucesso

- Build passa sem erro
- `curl http://localhost:3000/api/auth/session` retorna JSON válido (status 200)

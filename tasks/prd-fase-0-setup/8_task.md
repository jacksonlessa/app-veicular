---
status: pending
parallelizable: true
blocked_by: ["3.0", "4.0"]
---

<task_context>
<domain>docs</domain>
<type>documentation</type>
<scope>configuration</scope>
<complexity>low</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 8.0: Variáveis de ambiente, gitignore e README

## Visão Geral

Consolidar o onboarding do projeto: `.env.example` completo, `.gitignore` cobrindo segredos e artefatos, e `README.md` com os passos de setup local e a regra de dependência entre camadas Clean DDD.

<requirements>
- `.env.example` com `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `.env.local` documentado como obrigatório e fora do versionamento
- `.gitignore` cobre `.env.local`, `.env`, `node_modules/`, `.next/`, `prisma/dev.db*`
- `README.md` com passos: clone → install → copy env → migrate → dev
- README documenta regra: `presentation → application → domain ← infrastructure`
</requirements>

## Subtarefas

- [ ] 8.1 Criar `.env.example` com as três chaves
- [ ] 8.2 Ajustar `.gitignore` (adicionar `.env.local`, `prisma/dev.db*` se ausentes)
- [ ] 8.3 Criar `.env.local` local (não versionado) com `DATABASE_URL="file:./dev.db"`
- [ ] 8.4 Escrever `README.md` com pré-requisitos (Node 20), passos de setup, scripts disponíveis
- [ ] 8.5 Incluir seção "Arquitetura" no README com diagrama Clean DDD e regra de dependência

## Detalhes de Implementação

`.env.example`:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="changeme"
NEXTAUTH_URL="http://localhost:3000"
```

Bloco do README:
```markdown
## Setup local

1. `nvm use` (Node 20)
2. `npm install`
3. `cp .env.example .env.local` e ajustar se necessário
4. `npx prisma migrate dev`
5. `npm run dev`

## Arquitetura

presentation (app/, components/) → application → domain ← infrastructure

O `domain/` não importa de nenhuma outra camada.
```

## Critérios de Sucesso

- `git status` não lista `.env.local` nem `prisma/dev.db`
- `README.md` permite a um novo dev rodar o projeto sem perguntas
- `.env.example` não contém segredos reais

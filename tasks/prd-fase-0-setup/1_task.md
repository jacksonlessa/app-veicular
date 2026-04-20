---
status: completed
parallelizable: false
blocked_by: []
---

<task_context>
<domain>infra</domain>
<type>implementation</type>
<scope>configuration</scope>
<complexity>low</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 1.0: Bootstrap Next.js + TypeScript + ESLint + Prettier

## Visão Geral

Inicializar o repositório com Next.js 15 (App Router), TypeScript strict, ESLint (config padrão Next) e Prettier. Fixar Node 20 LTS via `.nvmrc`.

<requirements>
- Next.js 15 com App Router, `src/` dir e alias `@/*`
- TypeScript em modo strict
- ESLint funcional (`npm run lint`)
- Prettier configurado com `.prettierrc`
- `.nvmrc` com conteúdo `20`
- Scripts `dev`, `build`, `start`, `lint`, `format` no `package.json`
</requirements>

## Subtarefas

- [x] 1.1 Rodar `npx create-next-app@latest . --typescript --app --src-dir --tailwind --eslint --import-alias "@/*"`
- [x] 1.2 Verificar `tsconfig.json` com `"strict": true` e `paths: { "@/*": ["./src/*"] }`
- [x] 1.3 Criar `.nvmrc` com `20`
- [x] 1.4 Instalar Prettier (`npm i -D prettier`) e criar `.prettierrc` básico
- [x] 1.5 Adicionar script `format` no `package.json` (`prettier --write .`)
- [x] 1.6 Rodar `npm run lint` e `npm run build` para validar

## Detalhes de Implementação

Next.js 15 + React 19. O comando `create-next-app` já instala Tailwind — a configuração completa dos tokens fica na task 5.0. O ESLint vem com a config `next/core-web-vitals`.

`.prettierrc` sugerido:
```json
{ "semi": true, "singleQuote": false, "trailingComma": "all", "printWidth": 100 }
```

## Critérios de Sucesso

- `npm install` conclui sem erros
- `npm run dev` sobe em `http://localhost:3000`
- `npm run lint` passa
- `npm run build` passa
- `node --version` respeita `.nvmrc`

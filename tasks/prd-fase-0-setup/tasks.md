# Resumo de Tarefas de Implementação — Fase 0: Setup do Projeto

## Tarefas

- [x] 1.0 Bootstrap Next.js + TypeScript + ESLint + Prettier
- [x] 2.0 Criar estrutura de pastas Clean DDD
- [ ] 3.0 Configurar Prisma com SQLite e schema completo
- [x] 4.0 Scaffolding do NextAuth.js
- [x] 5.0 Configurar Tailwind v4, fonte Plus Jakarta Sans e tokens Âmbar
- [ ] 6.0 Inicializar shadcn/ui e adicionar componentes base
- [ ] 7.0 Criar componente Logo e página de smoke test
- [ ] 8.0 Variáveis de ambiente, gitignore e README de setup

## Grafo de Dependências

```
1.0 ──┬── 2.0 ──┬── 4.0 ──┐
      ├── 3.0 ──┘         ├── 8.0
      └── 5.0 ── 6.0 ── 7.0 ┘
```

## Lanes Paralelas

- **Lane back/infra:** 2.0 → 3.0 → 4.0
- **Lane front:** 5.0 → 6.0 → 7.0
- **Lane docs:** 8.0 (após 3.0 e 4.0)

## Caminho Crítico

`1.0 → 5.0 → 6.0 → 7.0`

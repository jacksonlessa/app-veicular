---
status: completed
parallelizable: false
blocked_by: []
---

<task_context>
<domain>infra</domain>
<type>configuration</type>
<scope>configuration</scope>
<complexity>low</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 1.0: Setup de Vitest, argon2 e eslint-plugin-boundaries

## Visão Geral

Adicionar as dependências de teste e segurança usadas pela Fase 1 e configurar o gate de arquitetura que valida Clean DDD via ESLint. Sem esta base, as demais tasks não têm como rodar testes nem garantir fronteiras entre camadas.

<requirements>
- Vitest instalado e configurado para TS + alias `@/`
- `argon2` instalado (binding nativo; roda em Node runtime)
- `eslint-plugin-boundaries` configurado com regras Clean DDD
- Scripts `test` e `test:coverage` no `package.json`
- `npm run lint` passando com a configuração nova
- `npm test` executando (mesmo sem testes ainda)
</requirements>

## Subtarefas

- [x] 1.1 Instalar dev deps: `vitest`, `@vitest/coverage-v8`, `eslint-plugin-boundaries`
- [x] 1.2 Instalar dep: `argon2`
- [x] 1.3 Criar `vitest.config.ts` com `environment: "node"`, alias `@/` espelhando `tsconfig`, `coverage.provider: "v8"`
- [x] 1.4 Adicionar scripts `"test": "vitest run"` e `"test:coverage": "vitest run --coverage"` no `package.json`
- [x] 1.5 Configurar `eslint-plugin-boundaries` no ESLint: definir elements (`domain`, `application`, `infrastructure`, `app`, `components`) e regras `boundaries/dependencies` (domain não importa de outras camadas; application não importa de infrastructure/app)
- [x] 1.6 Rodar `npm run lint` e `npm test` para validar baseline

## Detalhes de Implementação

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  test: {
    environment: "node",
    coverage: { provider: "v8", reporter: ["text", "html"] },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

ESLint (trecho) — definir como `warn` inicialmente se houver ruído; promover a `error` no final da fase:
```js
{
  settings: {
    "boundaries/elements": [
      { type: "domain", pattern: "src/domain/**" },
      { type: "application", pattern: "src/application/**" },
      { type: "infrastructure", pattern: "src/infrastructure/**" },
      { type: "app", pattern: "src/app/**" },
      { type: "components", pattern: "src/components/**" },
    ],
  },
  rules: {
    "boundaries/element-types": ["error", {
      default: "allow",
      rules: [
        { from: "domain", disallow: ["application", "infrastructure", "app", "components"] },
        { from: "application", disallow: ["infrastructure", "app"] },
      ],
    }],
  },
}
```

## Critérios de Sucesso

- `npm test` executa Vitest (exit 0, zero testes)
- `npm run lint` passa
- Adicionar `import "@/infrastructure/x"` dentro de `src/domain/shared/x.ts` dispara erro de lint
- `argon2` importável em arquivo Node sem erro de binding

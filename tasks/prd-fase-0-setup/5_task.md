---
status: pending
parallelizable: true
blocked_by: ["1.0"]
---

<task_context>
<domain>front</domain>
<type>implementation</type>
<scope>configuration</scope>
<complexity>medium</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 5.0: Configurar Tailwind v4, fonte Plus Jakarta Sans e tokens Âmbar

## Visão Geral

Aplicar o design system do protótipo `docs/RodagemApp.html` (tema Âmbar): carregar Plus Jakarta Sans via `next/font/google`, definir tokens CSS Âmbar em `globals.css` usando `@theme` do Tailwind v4.

<requirements>
- Plus Jakarta Sans (400, 500, 600, 700, 800) carregada via `next/font/google`
- Fonte aplicada globalmente em `layout.tsx`
- `globals.css` com `@import "tailwindcss"` + bloco `@theme` com todos os tokens Âmbar
- `<html lang="pt-BR">` em `app/layout.tsx`
- Tokens consumíveis via classes Tailwind (ex: `bg-bg`, `text-text`, `bg-accent`)
</requirements>

## Subtarefas

- [ ] 5.1 Ajustar `app/layout.tsx` para carregar `Plus_Jakarta_Sans` via `next/font/google`
- [ ] 5.2 Setar `lang="pt-BR"` no `<html>` e aplicar a classe da fonte ao `<body>`
- [ ] 5.3 Reescrever `src/app/globals.css` com `@import "tailwindcss"` e bloco `@theme` completo
- [ ] 5.4 Definir `body { background: var(--color-bg); color: var(--color-text); }`
- [ ] 5.5 Validar em DevTools que a fonte e cores Âmbar estão aplicadas

## Detalhes de Implementação

Tokens Âmbar (do protótipo):

```css
@import "tailwindcss";

@theme {
  --color-bg: #F0EEE8;
  --color-surface: #FFFFFF;
  --color-surface-2: #F8F7F3;
  --color-border: #E5E2DA;
  --color-text: #1A1814;
  --color-text-2: #6B6760;
  --color-text-3: #A8A39C;
  --color-accent: oklch(0.58 0.19 38);
  --color-accent-light: oklch(0.94 0.06 38);
  --color-teal: oklch(0.58 0.14 188);
  --color-teal-light: oklch(0.94 0.05 188);
  --color-green: oklch(0.62 0.15 145);
  --color-red: oklch(0.58 0.18 20);
  --radius: 14px;
  --radius-sm: 8px;
  --font-sans: "Plus Jakarta Sans", system-ui, sans-serif;
}
```

## Critérios de Sucesso

- `npm run dev` renderiza com fundo `#F0EEE8` e fonte Plus Jakarta Sans
- Classes `bg-accent` / `text-text-2` aplicam as cores Âmbar corretas
- DevTools confirma a família da fonte

# Task 7.0 Review — Componente Logo e página de smoke test

## Verdict: APPROVED

## Findings

### Critical
_None._

### High
_None._

### Medium

**M1 — SVG sem `aria-label` / `aria-hidden`**

`Logo.tsx` renderiza um SVG decorativo sem nenhum atributo de acessibilidade. A task exige "nenhum warning de acessibilidade básico no console". O SVG deve receber `aria-hidden="true"` (pois o texto "RodagemApp" já descreve o componente) ou um `<title>` interno com `aria-labelledby`. Não bloqueia build, mas viola o critério de aceitação da task.

**M2 — `tracking-tight` no lugar de `letterSpacing: '-0.03em'`**

O protótipo (`RodagemApp.html`, linha 250–251) usa `letterSpacing:'-0.03em'` explicitamente. A implementação usa a utilitária `tracking-tight` do Tailwind, que resolve para `-0.025em` — divergência pequena mas observável. Como a task pede fidelidade visual ao protótipo, o valor exato deveria ser aplicado via `style` ou token customizado.

**M3 — Font size: `size * 0.5` vs `size * 0.56` do protótipo**

O protótipo usa `fontSize: size * 0.56`; a implementação usa `size * 0.5`. Para `size={48}` (valor usado na página) isso resulta em 24 px versus 26.88 px — diferença perceptível no cabeçalho. O mesmo vale para o ícone: o protótipo usa `size * 0.6`, a implementação usa `size * 0.55`.

### Low

**L1 — `flex items-center` duplicado no wrapper de texto**

O `<div className="leading-none flex items-center">` adiciona `flex items-center` ao contêiner das duas `<span>`. Isso não causa problema funcional, mas o `leading-none` fica semanticamente redundante quando `flex` alinha os elementos por baseline. A estrutura do protótipo usa apenas `lineHeight:1` no div, sem flex extra.

**L2 — `font-sans` aplicado em duplicidade no `<body>`**

Em `layout.tsx`, `<html>` já recebe `className={cn("font-sans", plusJakartaSans.variable)}` e `<body>` recebe `className={${plusJakartaSans.variable} antialiased}`. O CSS de `@layer base` também aplica `@apply font-sans` em `html`. A variável CSS `--font-sans` é registrada duas vezes (uma via `next/font` e outra via `@theme`), mas ambas apontam ao mesmo valor — não quebra, apenas é redundante.

**L3 — Componente sem `export default`**

`Logo.tsx` usa named export (`export function Logo`), o que é consistente com shadcn/ui. Não é um problema, mas vale registrar para manter uniformidade se outros componentes custom forem adicionados.

## Summary

A implementação cobre todos os critérios funcionais da task: `Logo.tsx` existe, aceita a prop `size` com default 32, usa os tokens `bg-accent`, `text-text` e `text-accent`, e `page.tsx` renderiza Logo + Button "Entrar" com layout centralizado em pt-BR. O `npm run build` passou sem erros ou warnings de tipo.

As divergências encontradas são de média/baixa severidade e dizem respeito principalmente à fidelidade visual exata com o protótipo (coeficientes de escala e letter-spacing) e ao SVG sem atributo de acessibilidade. Nenhuma delas bloqueia a operação do design system nas fases seguintes.

## Required Actions Before Completion

1. Adicionar `aria-hidden="true"` ao `<svg>` em `Logo.tsx` (ou um `<title>` com `aria-labelledby`) para eliminar o warning de acessibilidade citado nos critérios de sucesso da task.
2. (Recomendado) Ajustar os coeficientes de escala para alinhar com o protótipo: `size * 0.56` no font-size e `size * 0.6` no ícone SVG.
3. (Recomendado) Substituir `tracking-tight` por `style={{ letterSpacing: '-0.03em' }}` para fidelidade com o protótipo.

As ações 2 e 3 são recomendações de qualidade visual; apenas a ação 1 (acessibilidade) é formalmente exigida pelo critério de sucesso da task ("nenhum warning de acessibilidade básico no console").

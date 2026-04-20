# Task 6.0 Review — Inicializar shadcn/ui e adicionar componentes base

## Verdict: APPROVED

## Findings

### Critical

None.

### High

**H1 — style em `components.json` diverge do especificado na task**

`components.json` registra `"style": "base-nova"`. A subtarefa 6.1 instrui o style `"new-york"`. O shadcn `base-nova` usa `@base-ui/react` como primitivo de UI em vez de Radix UI (que o estilo `new-york` padrão utiliza). O projeto funciona e compila, pois `@base-ui/react` está instalado e todos os componentes importam dele corretamente. Porém a divergência representa uma decisão arquitetural não documentada que pode surpreender colaboradores e pode causar incompatibilidades ao adicionar futuros componentes shadcn que assumam Radix. Recomenda-se ou (a) documentar a escolha pelo `base-nova`/`@base-ui` explicitamente no README ou no próprio `components.json` como comentário, ou (b) realinhar com `new-york` se Radix for preferido para consistência com a documentação shadcn mainstream.

### Medium

**M1 — Colisão de definição de `--radius-sm`**

O token `--radius-sm` é definido duas vezes no `globals.css`:

- Linha 22 dentro do bloco `@theme`: `--radius-sm: 8px;` (token Âmbar definido pelo TechSpec)
- Linha 66 dentro do bloco `@theme inline`: `--radius-sm: calc(var(--radius) * 0.6);`

Em Tailwind v4, `@theme inline` sobrescreve valores do `@theme` para o mesmo nome. Isso significa que `--radius-sm` resultante é `calc(0.875rem * 0.6) ≈ 8.4px` (usando o `--radius` do `:root` de `0.875rem`) em vez dos `8px` especificados como token Âmbar. O impacto visual é mínimo (~0.4px), mas quebra a fidelidade do token declarado no TechSpec. Para corrigir, remover `--radius-sm` do bloco `@theme inline` ou mantê-lo só no `@theme` com o valor fixo Âmbar.

**M2 — Dependência `shadcn` em `dependencies` em vez de `devDependencies`**

O pacote `"shadcn": "^4.3.1"` está listado em `dependencies` no `package.json`. A ferramenta `shadcn` é um CLI de geração de código e não deve ser bundled no runtime. Deveria estar em `devDependencies`. Não afeta o build, mas aumenta o artefato de produção desnecessariamente.

**M3 — Dois blocos `body` em `globals.css`**

O `body { background: var(--color-bg); color: var(--color-text); }` aparece duas vezes: na linha 27 (após o `@theme`) e na linha 120 dentro do `@layer base`. O bloco da linha 27 é redundante e pode ser removido.

### Low

**L1 — `lucide-react` em versão `^1.8.0` (major incomum)**

`package.json` registra `"lucide-react": "^1.8.0"`. A versão `1.x` do lucide-react é anormal; a versão estável atual é a série `0.x`. Pode ser um erro de digitação ou o npm resolveu uma versão futura/rc. Vale verificar com `npm list lucide-react` se a versão instalada é compatível.

**L2 — Tokens `dark:` nos componentes com tema único**

Os componentes gerados (button, input, switch, tabs, badge) contêm classes `dark:*` no Tailwind. O PRD e o TechSpec explicitam que o App Veicular usa exclusivamente o tema Âmbar sem seletor de tema. O `globals.css` omite o bloco `:root[dark]` corretamente, mas as classes `dark:` nos componentes ficam ativas se alguém adicionar `class="dark"` ao `<html>`. Não é um problema de runtime mas cria ruído. Pode-se documentar que as classes dark devem ser ignoradas ou removidas em limpeza futura.

## Summary

A implementação da task 6.0 está funcionalmente correta. Todos os 9 componentes requeridos (`button`, `input`, `select`, `card`, `badge`, `tabs`, `switch`, `label`, `separator`) existem em `src/components/ui/`, `src/lib/utils.ts` exporta `cn()` com a implementação correta via `clsx` + `tailwind-merge`, `components.json` existe e está bem formado, `npm run build` passa sem erros, `cn("a", false && "b", "c")` retorna `"a c"`, os tokens Âmbar estão presentes no `@theme` sem sobrescrever `--color-accent`, e `--primary` aponta corretamente para `oklch(0.58 0.19 38)`.

A única divergência relevante em relação ao especificado é o uso de `style: "base-nova"` com `@base-ui/react` como primitivo em vez do `style: "new-york"` com Radix UI indicado na subtarefa 6.1. Isso não impede o funcionamento, mas precisa ser documentado.

## Required Actions Before Completion

1. (Recomendado) Documentar no README ou em `components.json` a razão da escolha de `base-nova`/`@base-ui/react` em vez de `new-york`/Radix, para que futuras adições de componentes shadcn sigam o mesmo padrão.
2. (Recomendado) Remover a segunda definição de `--radius-sm` do bloco `@theme inline` para preservar o valor `8px` do token Âmbar.
3. (Limpeza) Mover `shadcn` de `dependencies` para `devDependencies` no `package.json`.
4. (Limpeza) Remover o bloco `body` duplicado na linha 27 do `globals.css`.

---
status: completed
parallelizable: false
blocked_by: ["5.0"]
---

<task_context>
<domain>front</domain>
<type>implementation</type>
<scope>configuration</scope>
<complexity>medium</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 6.0: Inicializar shadcn/ui e adicionar componentes base

## Visão Geral

Executar `shadcn init` para configurar `components.json` e `lib/utils.ts` (`cn()`). Em seguida adicionar os componentes base que serão usados ao longo das fases seguintes.

<requirements>
- `shadcn/ui` inicializado (gera `components.json` e `src/lib/utils.ts`)
- Componentes adicionados: `button`, `input`, `select`, `card`, `badge`, `tabs`, `switch`, `label`, `separator`
- Todos os componentes residem em `src/components/ui/`
- Compatibilidade com Tailwind v4 e tokens Âmbar definidos na task 5.0
</requirements>

## Subtarefas

- [x] 6.1 `npx shadcn@latest init` (responder: TypeScript, style "new-york", alias `@/components`)
- [x] 6.2 `npx shadcn@latest add button input select card badge tabs switch label separator`
- [x] 6.3 Verificar se os componentes consomem os tokens Âmbar (ajustar `--primary` se necessário para apontar para `--color-accent`)
- [x] 6.4 Confirmar que `src/lib/utils.ts` exporta `cn()`

## Detalhes de Implementação

O `shadcn init` pode gerar seu próprio bloco de tokens em `globals.css` — **mesclar** com os tokens Âmbar da task 5.0 em vez de sobrescrever. O token `--primary` do shadcn deve mapear para `--color-accent`.

Se houver conflito com Tailwind v4, seguir a documentação shadcn vigente (flag `--tailwind v4` ou adaptação manual).

## Critérios de Sucesso

- `src/components/ui/button.tsx` existe e exporta `<Button>`
- Um `<Button>` renderizado em página de teste aparece com fundo Âmbar
- `npm run build` passa
- `cn("a", false && "b", "c")` retorna `"a c"`

---
status: completed
parallelizable: false
blocked_by: ["6.0", "2.0"]
---

<task_context>
<domain>front</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 7.0: Componente Logo e página de smoke test

## Visão Geral

Criar o componente `Logo` replicando o visual do protótipo (`docs/RodagemApp.html`, componente `Logo`) e uma página inicial `/` mínima que renderiza Logo + Button shadcn como prova de vida do design system.

<requirements>
- `src/components/ui/Logo.tsx` renderiza "Rodagem" + "App" (accent) + ícone de estrada em quadrado Âmbar
- Aceita prop `size` (default 32)
- Usa tokens `--color-accent` e `--color-text`
- Página `src/app/page.tsx` exibe Logo centralizado + um `<Button>` "Entrar"
- Página em pt-BR
</requirements>

## Subtarefas

- [x] 7.1 Criar `src/components/ui/Logo.tsx` seguindo o protótipo (SVG inline ou `lucide-react`)
- [x] 7.2 Reescrever `src/app/page.tsx` com Logo + Button + título de boas-vindas
- [x] 7.3 Validar visualmente em `http://localhost:3000` contra o protótipo

## Detalhes de Implementação

Referência do protótipo (linhas 243–254 de `RodagemApp.html`):

```tsx
<div className="flex items-center gap-2">
  <div className="rounded-[28%] bg-accent flex items-center justify-center" style={{ width: size, height: size }}>
    {/* SVG road icon em branco */}
  </div>
  <div className="leading-none">
    <span className="font-extrabold text-text tracking-tight">Rodagem</span>
    <span className="font-extrabold text-accent tracking-tight">App</span>
  </div>
</div>
```

Ícone "road" (traçado do protótipo):
```svg
<path d="M4 21l4-18h8l4 18"/>
<path d="M9.5 11h5"/>
<path d="M8 17h8"/>
```

Página `/`: layout centralizado `min-h-screen flex items-center justify-center`, max-w-[430px].

## Critérios de Sucesso

- `/` renderiza Logo + Button
- Visualmente idêntico ao `LoginScreen` header do protótipo
- `npm run build` passa
- Nenhum warning de acessibilidade básico no console

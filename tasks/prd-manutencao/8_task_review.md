# Task 8.0 Review — MaintenanceItemRow + MaintenanceForm + Zod schema client-side

## Verdict: APPROVED

## Findings

### Critical
Nenhum.

### High
Nenhum.

### Medium

**M1 — Schema Zod: `odometer` não aceita valor zero (`positive()` rejeita 0, mas `min={0}` no input sugere que zero é permitido)**

O schema define:
```ts
odometer: z.coerce.number().int("Odômetro deve ser inteiro").positive("Odômetro deve ser > 0").optional().or(z.literal(""))
```
O campo usa `positive()`, que rejeita 0. No HTML o input tem `min={0}`, sugerindo que 0 seria aceito. Para um odômetro 0 é um valor legítimo (veículo novo). O schema da task define apenas que é `optional`, sem restrição de positivo. Alinhar com a task: substituir `positive()` por `nonnegative()` ou `min(0)`.

**M2 — `MaintenanceItemRow` não usa `react-hook-form` / `useFieldArray` — diverge do contrato da task e da TechSpec**

A task e a TechSpec especificam explicitamente `useFieldArray` (react-hook-form) e que `MaintenanceItemRow` recebe `control` como prop:
- Task: "Subtotal calculado via: `const qty = watch(`items.${index}.quantity`)`"
- TechSpec: "controlled via react-hook-form Field Array"

A implementação usa estado local manual (`useState<MaintenanceItemRowState[]>`) + prop `onChange` em vez de `useFieldArray`. Isso é funcionalmente equivalente e não é um erro crítico (o comportamento visual e de submissão está correto), mas representa desvio do contrato arquitetural estabelecido. Se o `MaintenanceHistoryList` (tarefa posterior) ou páginas de edição precisarem de reset programático, revalidação parcial ou integração com `formState.isDirty`, o padrão `useState` manual tornará essa evolução mais difícil.

**M3 — `canRemove` baseado em `items.length > 1` impede remoção de item quando há exatamente 1, mas não exibe aviso**

Quando há apenas 1 item, o botão de remoção é ocultado silenciosamente via `canRemove`. O usuário não tem feedback de por que não pode remover. Seria adequado exibir um tooltip ou texto informativo. Não bloqueia a entrega, mas prejudica UX.

### Low

**L1 — `key={index}` em vez de `key` estável nas linhas de item**

`items.map((item, index) => <MaintenanceItemRow key={index} ...>)` — usar o índice como `key` causa comportamento inesperado de foco/estado quando itens são removidos do meio da lista. Recomendado usar um `id` gerado (`crypto.randomUUID()` ou similar) para cada item.

**L2 — Content-Type não verificado na resposta do servidor**

No `handleSubmit`, o erro é recuperado com `res.json().catch(() => ({}))`, o que é seguro, mas se o servidor retornar HTML (erro 500 de Next.js), o `body?.message` será undefined e o fallback "Erro ao salvar manutenção (500)" é adequado. Sem impacto funcional real.

**L3 — Build com erro pré-existente não relacionado à tarefa**

O `npm run build` falha com `NoopMailer cannot be used in production` (rota `/api/invites/[token]`) — erro pré-existente, não introduzido por esta tarefa. Os novos arquivos compilam sem erros TypeScript ou ESLint.

## Summary

A implementação cobre todos os requisitos funcionais da tarefa:
- Schema Zod valida veículo obrigatório, data obrigatória (com refine anti-futuro), ao menos 1 item, quantity > 0, unitPrice > 0.
- `MaintenanceItemRow` calcula subtotal em tempo real via estado derivado (`parseFloat(item.quantity) * parseFloat(item.unitPrice)`), exibido como span somente-leitura.
- `MaintenanceForm` exibe total no rodapé atualizado em tempo real via `reduce` sobre o estado `items`.
- O formulário inicia com 1 item vazio quando não há `defaultValues`.
- Submit chama `POST /api/maintenances` (criar) ou `PUT /api/maintenances/[id]` (editar) com `Content-Type: application/json`.
- Redireciona para `/veiculos/${result.data.vehicleId}?tab=manutencao` após sucesso.
- Estilo visual segue o padrão do `FuelupForm`: `max-w-[430px]`, fundo âmbar no rodapé, tipografia e cores idênticas, estrutura de `Label + Input + erro`.

O principal desvio arquitetural (uso de `useState` manual em vez de `useFieldArray`) não afeta a entrega do MVP mas acumula dívida técnica para tarefas futuras.

## Required Actions Before Completion

Nenhuma ação bloqueante. Os itens M1 e L1 são recomendados para correção antes de avançar para tarefas que dependam diretamente deste componente (edição de manutenção, histórico).

- **Recomendado (M1):** Corrigir validação do odômetro: `z.coerce.number().int().nonnegative().optional().or(z.literal(""))`.
- **Recomendado (L1):** Adicionar `id` UUID estável a cada item para usar como `key` no map.

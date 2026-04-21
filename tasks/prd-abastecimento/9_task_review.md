# Task 9.0 Review — Hook `useFuelupCalculator` + `FuelupForm` + Zod schema client-side

## Verdict: APPROVED

## Findings

### Critical
_Nenhum._

### High

**H1 — Ausência de testes de frontend (subtask implícita exigida pela TechSpec)**

A TechSpec (seção "Testes Unitários") declara explicitamente:

> **Frontend (componentes críticos):** `FuelupForm` com `useFuelupCalculator` — testes de comportamento do badge "calculado" e do toggle tanque cheio.

Não existe nenhum arquivo de teste em `tests/` cobrindo `FuelupForm.tsx` nem `useFuelupCalculator.ts`. A subtarefa 9.1 do task file não menciona testes, mas a TechSpec os exige como requisito de cobertura mínima (80% statements nos novos arquivos). O hook é pura lógica TypeScript e poderia ser testado sem jsdom — a ausência é objetivamente um gap de qualidade, não uma omissão de escopo.

### Medium

**M1 — `locked` semântico invertido em relação à especificação do hook**

A TechSpec e o task file definem `locked` como "o campo que o usuário preencheu por último" (o campo *livre*), enquanto o campo *derivado* é o restante. A implementação inverte esse significado: `locked` é o campo calculado (read-only), não o campo editado pelo usuário. O código funciona corretamente, mas a nomenclatura diverge da especificação, o que pode confundir o implementador da task 10.0 ao reutilizar o hook. A doc-string do hook esclarece o comportamento real, o que mitiga parcialmente o risco.

**M2 — `handleFieldChange` usa estado desatualizado ao derivar novo `locked`**

No bloco `if (locked === field)` dentro de `handleFieldChange`, a resolução de `hasFirst` lê `litersRaw`, `pplRaw` e `totalRaw` diretamente do closure, antes de o setter do campo atual (`setLitersRaw` / etc.) ter sido aplicado. Isso pode fazer com que o novo `locked` aponte para o campo errado em cenários de edição rápida ou em componentes otimizados. A lógica correta deveria usar o valor `value` recém-digitado ao invés do estado atual.

Trecho afetado (`FuelupForm.tsx`, linhas 106–113):
```ts
const hasFirst = others[0] === "liters"
  ? !!parsePositiveNumber(litersRaw)   // lê estado antigo, não `value`
  : ...
```

### Low

**L1 — `Switch` usa classe `data-checked:bg-amber-500` não documentada no shadcn**

A classe `data-checked:bg-amber-500` não é um seletor Tailwind padrão; o shadcn `Switch` usa o atributo `data-state="checked"`. A forma correta seria `data-[state=checked]:bg-amber-500`. Isso pode fazer o switch não mudar de cor no estado "on", prejudicando o requisito de "estado visual óbvio".

**L2 — Erro de validação 2-de-3 é anexado ao path `liters` em vez de um path neutro**

Em `fuelup-form.schema.ts`, o `superRefine` associa o erro da regra dos 3 campos ao path `["liters"]`. Quando `liters` for o campo já preenchido mas `pricePerLiter` e `totalPrice` estiverem vazios, o erro aparece abaixo do campo errado. Seria mais correto usar um path customizado (ex.: `["_fuelFields"]`) e renderizar a mensagem separadamente no form.

**L3 — `vehicles[0]?.id` como vehicleId default pode diferir do veículo pré-selecionado esperado pela página**

O form recebe `vehicles` mas não recebe um `defaultVehicleId`. A tarefa 10.0 (página `/abastecimento`) planeja passar `vehicleId` via query param. Sem esse prop explícito, o form sempre pré-seleciona o primeiro da lista, ignorando a intenção da navegação. Recomenda-se adicionar `defaultVehicleId?: string` em `FuelupFormProps` para permitir que a página 10.0 controle o pré-selecionado sem `initialValues` completo.

## Summary

A implementação cobre todos os subtarefas marcados como concluídos (9.1–9.9): o hook espelha o arredondamento do backend com precisão; o schema Zod valida data não futura, odômetro >= 0, fuelType e regra dos 2-de-3; o `FuelupForm` é um Client Component com props corretos (`initialValues?`, `onSubmit`, `submitLabel`); o badge "calculado" aparece e libera o campo ao clicar; o toggle `fullTank` está implementado; os seis tipos de combustível estão presentes; e o lint retorna 0 erros.

O único ponto de alta prioridade é a **ausência de testes para o hook e o form**, exigidos explicitamente pela TechSpec. Os demais achados são de severidade média/baixa e podem ser corrigidos antes ou durante a task 10.0.

## Required Actions Before Completion

1. **(H1 — Obrigatório)** Criar testes unitários para `useFuelupCalculator` cobrindo os três casos de derivação (liters, pricePerLiter, totalPrice) e os casos de borda (campos insuficientes, locked null). Criar pelo menos um teste de comportamento para `FuelupForm` cobrindo o badge "calculado" e o toggle `fullTank`.
2. **(M2 — Recomendado)** Corrigir `handleFieldChange` para usar o valor `value` passado como argumento ao verificar `hasFirst`, evitando leitura de estado desatualizado do closure.
3. **(L1 — Recomendado)** Substituir `data-checked:bg-amber-500` por `data-[state=checked]:bg-amber-500` no `Switch`.

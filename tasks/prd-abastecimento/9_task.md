---
status: completed
parallelizable: true
blocked_by: []
---

<task_context>
<domain>front/components</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 9.0: Hook `useFuelupCalculator` + `FuelupForm` + Zod schema client-side

## Visão Geral

Implementa a lógica client-side da regra dos 3 campos e o componente de formulário, reutilizado pelas páginas de criação e edição (task 10.0). O hook espelha `FuelupService.compute` — mesmas regras de arredondamento — para que o badge "calculado" apareça em tempo real enquanto o usuário digita. O formulário usa shadcn (`Input`, `Label`, `Switch`, `Select`, `Badge`, `Button`) e tokens âmbar para fidelidade ao `FuelScreen` do protótipo.

<requirements>
- Hook: `src/components/fuelups/useFuelupCalculator.ts`
- Componente: `src/components/fuelups/FuelupForm.tsx`
- Schema Zod: `src/components/fuelups/fuelup-form.schema.ts` (validação client-side antes do submit)
- Arredondamento idêntico ao backend (`Math.round(x * 100) / 100` para preços, `* 1000 / 1000` para litros)
- Campo "calculado" exibe badge visual e fica `readOnly`
- Toggle "tanque cheio" com estado visual óbvio; default = true
- Fidelidade visual ao `FuelScreen` em `docs/RodagemApp.html`
- Sem dependências do backend — componente é totalmente independente
</requirements>

## Subtarefas

- [x] 9.1 Criar hook `useFuelupCalculator({ liters, pricePerLiter, totalPrice, locked })`; `locked` indica qual dos 3 o usuário preencheu por último (o terceiro é sempre derivado)
- [x] 9.2 Implementar arredondamento idêntico ao `FuelupService.compute`
- [x] 9.3 Criar `fuelup-form.schema.ts` com validação Zod (data não futura, odômetro >= 0, pelo menos 2 dos 3 campos preenchidos, `fuelType` obrigatório)
- [x] 9.4 Criar `FuelupForm.tsx` como Client Component com props `{ initialValues?, onSubmit, submitLabel }`
- [x] 9.5 Integrar hook no form: ao digitar em 2 campos, o terceiro é calculado e exibe badge "calculado"
- [x] 9.6 Toggle `fullTank` (shadcn `Switch`) com label "Tanque cheio"
- [x] 9.7 Select de `fuelType` (Gasolina, Gasolina Aditivada, Etanol, Diesel, GNV, Elétrico) — estático no MVP
- [x] 9.8 Abrir `docs/RodagemApp.html` no browser e reproduzir layout/cores do `FuelScreen`
- [x] 9.9 `npm run lint` verde

## Detalhes de Implementação

**Hook:**

```ts
export function useFuelupCalculator(input: {
  liters?: number;
  pricePerLiter?: number;
  totalPrice?: number;
  locked: "liters" | "pricePerLiter" | "totalPrice" | null;
}) {
  const { liters, pricePerLiter, totalPrice, locked } = input;
  // calcula o terceiro automaticamente com mesmas regras de arredondamento do FuelupService
  // retorna { liters, pricePerLiter, totalPrice, calculated: "liters" | "pricePerLiter" | "totalPrice" | null }
}
```

**Form layout:**

```tsx
<Card>
  <Label>Data</Label> <Input type="date" />
  <Label>Odômetro</Label> <Input type="number" suffix="km" />
  <Label>Combustível</Label> <Select>{FUEL_TYPES}</Select>
  <Switch label="Tanque cheio" />
  <Label>Litros</Label> <Input type="number" {...maybeCalculatedProps("liters")} />
  <Label>R$ / Litro</Label> <Input type="number" {...maybeCalculatedProps("pricePerLiter")} />
  <Label>Valor Total (R$)</Label> <Input type="number" {...maybeCalculatedProps("totalPrice")} />
  <Button type="submit">{submitLabel}</Button>
</Card>
```

O campo derivado recebe `<Badge variant="calculated">calculado</Badge>` ao lado do label e fica com `readOnly`. Ao clicar no badge, o campo é "liberado" e passa a ser editável (o `locked` muda).

## Critérios de Sucesso

- Hook calcula os 3 casos (liters+ppl → total, liters+total → ppl, ppl+total → liters) com arredondamento idêntico ao backend
- Form não submete se regra de 2-de-3 é violada (validação Zod inline)
- Toggle `fullTank` muda visualmente e é enviado no payload
- Layout reflete o `FuelScreen` do protótipo (revisão visual manual)
- `npm run lint` verde

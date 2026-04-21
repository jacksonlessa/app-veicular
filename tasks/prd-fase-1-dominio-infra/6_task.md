---
status: completed
parallelizable: true
blocked_by: ["5.0"]
---

<task_context>
<domain>back/domain/fuel</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 6.0: FuelupService — regra dos 3 campos + cálculo condicional de km/l

## Visão Geral

Implementar a service central de abastecimento: dada a entrada com 2 dos 3 campos (litros, preço/litro, total), calcular o terceiro; e calcular km/l somente quando os abastecimentos anterior e atual são marcados como tanque cheio. É a regra de negócio mais crítica do MVP — requer suíte de testes extensiva.

<requirements>
- Função estática `FuelupService.compute(input) → FuelupComputed`
- Rejeitar 0, 1 ou 3 campos dos três preenchidos (somente 2 é válido)
- Calcular o terceiro campo com precisão adequada (tolerância 1e-6 nos testes)
- `kml` só quando: `previous != null && previous.fullTank && currentFullTank && current.odometer > previous.odometer`
- Primeiro abastecimento (sem `previous`) → `kml = null` mesmo com `fullTank = true`
- `previous.odometer >= current.odometer` → `BusinessRuleError("odometer.not_increasing")`
- Cobertura ≥ 95% na matriz de cenários
</requirements>

## Subtarefas

- [x] 6.1 Criar `src/domain/fuel/services/fuelup.service.ts` com tipos `FuelupInput` e `FuelupComputed`
- [x] 6.2 Implementar validação de "exatamente 2 de 3" com `BusinessRuleError("fuelup.three_fields")`
- [x] 6.3 Implementar cálculo do terceiro campo conforme par informado
- [x] 6.4 Implementar cálculo condicional de `kml` com todas as guardas
- [x] 6.5 Criar suíte de testes cobrindo:
  - 0, 1, 3 campos → erro
  - 3 combinações de 2 campos (cálculo do terceiro)
  - `previous = null` → kml null
  - `previous.fullTank = false` → kml null
  - `currentFullTank = false` → kml null
  - Ambos tanque cheio, odometer crescente → kml válido
  - Odometer decrescente/igual → erro
  - Valores no limite (Kml = 50, 0.01)
- [x] 6.6 Rodar `npm test -- --coverage` e validar cobertura ≥ 95%

## Detalhes de Implementação

```ts
export type FuelupInput = {
  liters?: FuelAmount;
  pricePerLiter?: FuelPrice;
  totalPrice?: FuelPrice;
  currentOdometer: Odometer;
  currentFullTank: boolean;
  previous?: { odometer: Odometer; fullTank: boolean } | null;
};

export type FuelupComputed = {
  liters: FuelAmount;
  pricePerLiter: FuelPrice;
  totalPrice: FuelPrice;
  kml: Kml | null;
};

export class FuelupService {
  static compute(input: FuelupInput): FuelupComputed {
    const filled = [input.liters, input.pricePerLiter, input.totalPrice].filter(Boolean).length;
    if (filled !== 2) throw new BusinessRuleError("fuelup.three_fields");
    // ... calcular o terceiro ...
    // ... calcular kml condicional ...
  }
}
```

Cálculo:
- `liters` + `pricePerLiter` → `totalPrice = liters * pricePerLiter`
- `liters` + `totalPrice` → `pricePerLiter = totalPrice / liters`
- `pricePerLiter` + `totalPrice` → `liters = totalPrice / pricePerLiter`

Arredondar apenas ao instanciar VOs finais (ex.: `FuelPrice` com 2 casas, `FuelAmount` com 3 casas).

## Critérios de Sucesso

- Matriz completa de testes passa
- Cobertura ≥ 95% em `fuelup.service.ts`
- `compute({ liters: 40, pricePerLiter: 5, totalPrice: 200, ... })` lança `BusinessRuleError` (3 campos)
- Primeiro abastecimento com `currentFullTank=true` retorna `kml: null`

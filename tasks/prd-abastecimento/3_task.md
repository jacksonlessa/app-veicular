---
status: completed
parallelizable: true
blocked_by: []
---

<task_context>
<domain>back/application</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 3.0: Função pura `recalculateChain` + testes unitários

## Visão Geral

A cadeia de cálculo de km/l precisa ser reaplicada a cada mutação (create/update/delete). Esta task implementa `recalculateChain(fuelups: Fuelup[]): Fuelup[]` — função **pura**, sem I/O — em `src/application/usecases/fuelup/_shared/recalculate-chain.ts`. A regra clássica de consumo por tanque cheio é respeitada: parciais entre dois cheios entram no denominador do cálculo.

<requirements>
- Função pura, sem dependências de repositório
- Entrada: lista de `Fuelup` já ordenada canonicamente (mais antigo → mais novo)
- Saída: nova lista de `Fuelup` (via `Fuelup.rehydrate`) com `kmPerLiter` atualizado
- Não mutar a entrada
- Cobertura por suíte unitária em `tests/unit/application/usecases/fuelup/recalculate-chain.test.ts`
</requirements>

## Subtarefas

- [x] 3.1 Criar `src/application/usecases/fuelup/_shared/recalculate-chain.ts`
- [x] 3.2 Implementar a regra: iterar do mais antigo ao mais novo, manter `lastFullTank` e `litersAccumulated`
- [x] 3.3 Para cada fuelup `fullTank === true` com `lastFullTank !== null`: `kmPerLiter = (odometer − lastFullTank.odometer) / (litersAccumulated + fuelup.liters)`; atualizar `lastFullTank` e zerar acumulador
- [x] 3.4 Para `fullTank === true` sem `lastFullTank`: `kmPerLiter = null`; iniciar `lastFullTank`
- [x] 3.5 Para `fullTank === false`: `kmPerLiter = null`; somar litros ao acumulador
- [x] 3.6 Retornar nova lista via `Fuelup.rehydrate`
- [x] 3.7 Escrever testes cobrindo: (a) só cheios; (b) parciais entre dois cheios; (c) primeiro cheio da história sem anterior; (d) edição retroativa invalida posteriores; (e) exclusão do primeiro cheio zera o segundo; (f) entrada vazia

## Detalhes de Implementação

```ts
import { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import { Kml } from "@/domain/fuel/value-objects/kml.vo";

export function recalculateChain(fuelups: Fuelup[]): Fuelup[] {
  let lastFullTank: { odometer: number } | null = null;
  let litersAccumulated = 0;

  return fuelups.map((f) => {
    let kml: Kml | null = null;

    if (f.fullTank) {
      if (lastFullTank !== null) {
        const distance = f.odometer.value - lastFullTank.odometer;
        const denominator = litersAccumulated + f.liters.value;
        kml = Kml.create(distance / denominator);
      }
      lastFullTank = { odometer: f.odometer.value };
      litersAccumulated = 0;
    } else {
      litersAccumulated += f.liters.value;
    }

    return Fuelup.rehydrate({
      id: f.id,
      vehicleId: f.vehicleId,
      userId: f.userId,
      date: f.date,
      odometer: f.odometer,
      fuelType: f.fuelType,
      fullTank: f.fullTank,
      liters: f.liters,
      pricePerLiter: f.pricePerLiter,
      totalPrice: f.totalPrice,
      kmPerLiter: kml,
      createdAt: f.createdAt,
    });
  });
}
```

**Nota sobre ordering:** esta função não ordena; o use case chamador é responsável por ordenar canonicamente antes de invocar.

## Critérios de Sucesso

- Função cobre os 6 cenários de teste listados na subtarefa 3.7
- Entrada não é mutada (validar com snapshot)
- Saída preserva todos os outros campos (data, odometer, liters...) inalterados
- `npm test` verde; `npm run lint` verde

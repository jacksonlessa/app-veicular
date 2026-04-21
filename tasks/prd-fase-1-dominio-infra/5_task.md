---
status: completed
parallelizable: true
blocked_by: ["2.0"]
---

<task_context>
<domain>back/domain/fuel</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 5.0: Fuel context — VOs + Fuelup entity + repo interface

## Visão Geral

Modelar o contexto de abastecimento: VOs (`FuelAmount`, `FuelPrice`, `FuelDate`, `Kml`), entity `Fuelup` e interface `FuelupRepository`. A service de regra de negócio fica na Task 6.0.

<requirements>
- `FuelAmount` (litros) > 0 e <= 999
- `FuelPrice` >= 0 (aceita preço unitário e total)
- `FuelDate` data não futura
- `Kml` > 0 e <= 50 (sanity check — consumos fora disso são suspeitos)
- `Fuelup` entity com `id`, `vehicleId`, `userId`, `date: FuelDate`, `odometer: Odometer`, `fuelType`, `fullTank: boolean`, `liters: FuelAmount`, `pricePerLiter: FuelPrice`, `totalPrice: FuelPrice`, `kmPerLiter: Kml | null`, `createdAt`
- Factory `create` e `rehydrate`; `create` não calcula campos — só aceita e valida
- `FuelupRepository` interface com assinaturas completas
- Testes para VOs e entity
</requirements>

## Subtarefas

- [x] 5.1 Criar VOs em `src/domain/fuel/value-objects/`
- [x] 5.2 Criar `src/domain/fuel/entities/fuelup.entity.ts`
- [x] 5.3 Criar `src/domain/fuel/repositories/fuelup.repository.ts`
- [x] 5.4 Criar testes em `tests/unit/domain/fuel/` para VOs e entity
- [x] 5.5 Rodar `npm test` e `npm run lint`

## Detalhes de Implementação

`Kml` VO:
```ts
export class Kml extends ValueObject<number> {
  static create(v: number): Kml {
    if (!Number.isFinite(v) || v <= 0 || v > 50) throw new InvalidValueError("Kml", v);
    return new Kml(v);
  }
}
```

`FuelDate.create(d)` rejeita datas `>` agora (tolerância 60s para clock skew).

`Fuelup.create` recebe os valores já calculados (o cálculo em si vive em `FuelupService` — Task 6.0). A entity apenas valida coerência: `totalPrice ≈ liters * pricePerLiter` com tolerância 1e-2 (diferença de arredondamento aceitável).

`fuelType`: aceitar string livre agora (enum pode vir na Fase 4).

## Critérios de Sucesso

- VOs rejeitam valores fora de range
- `Fuelup.create` com `liters=10, pricePerLiter=5, totalPrice=60` lança `BusinessRuleError("fuelup.total_mismatch")`
- `Fuelup.create` com `kmPerLiter=null` é aceito
- Cobertura ≥ 90% em `src/domain/fuel/` (excluindo `services/` que é da Task 6.0)

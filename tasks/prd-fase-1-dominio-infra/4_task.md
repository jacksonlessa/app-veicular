---
status: completed
parallelizable: true
blocked_by: ["2.0"]
---

<task_context>
<domain>back/domain/vehicle</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 4.0: Vehicle context — VOs + Vehicle entity + repo interface

## Visão Geral

Modelar o contexto de veículos: VOs (`Plate`, `Odometer`, `VehicleName`), entity `Vehicle` e interface `VehicleRepository` (assinatura completa declarada, implementação parcial fica na Task 9.0).

<requirements>
- `Plate` valida formato brasileiro (antigo `AAA-9999` e Mercosul `AAA9A99`), normaliza uppercase sem separador
- `Odometer` inteiro >= 0
- `VehicleName` string não vazia, trim, máx 60 chars
- `Vehicle` entity com `id`, `accountId`, `name: VehicleName`, `plate: Plate | null`, `brand`, `model`, `color`, `initOdometer: Odometer`, `currentOdometer: Odometer`, `createdAt`
- `VehicleRepository` interface com assinaturas completas (findById, findByAccount, create, update, delete)
- Testes para todos os VOs e factory do Vehicle
</requirements>

## Subtarefas

- [x] 4.1 Criar `src/domain/vehicle/value-objects/odometer.vo.ts`
- [x] 4.2 Criar `src/domain/vehicle/value-objects/plate.vo.ts`
- [x] 4.3 Criar `src/domain/vehicle/value-objects/vehicle-name.vo.ts`
- [x] 4.4 Criar `src/domain/vehicle/entities/vehicle.entity.ts`
- [x] 4.5 Criar `src/domain/vehicle/repositories/vehicle.repository.ts`
- [x] 4.6 Criar testes em `tests/unit/domain/vehicle/`
- [x] 4.7 Rodar `npm test` e `npm run lint`

## Detalhes de Implementação

`Plate` regex combinado:
- Antigo: `/^[A-Z]{3}-?\d{4}$/`
- Mercosul: `/^[A-Z]{3}\d[A-Z]\d{2}$/`

Normalização: remover hífen, trim, uppercase.

`Vehicle.create` NÃO valida limite de 2 por conta — essa regra é use case da Fase 3.
`Vehicle.currentOdometer >= Vehicle.initOdometer` é invariante verificada em `create`/`rehydrate`.

## Critérios de Sucesso

- `Plate.create("abc-1234")` → VO com `value === "ABC1234"`
- `Plate.create("ABC1D23")` (Mercosul) válida
- `Plate.create("XX-1")` lança `InvalidValueError`
- `Odometer.create(-1)` lança erro
- `Vehicle.create({ initOdometer: 1000, currentOdometer: 500 })` lança `BusinessRuleError`
- Cobertura ≥ 90% em `src/domain/vehicle/`

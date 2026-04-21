# Task 4.0 Review — Vehicle context: VOs + Vehicle entity + repo interface

## Verdict: APPROVED

## Findings

### Critical
_None._

### High
_None._

### Medium

**M1 — `rehydrate` ainda valida o invariante de odômetro (comportamento diverge do contrato TechSpec)**

`Vehicle.rehydrate` chama `assertOdometerInvariant` antes de construir o objeto. O TechSpec especifica que `rehydrate` deve assumir os dados como já consistentes (vindos do banco) e **não** revalidar regras. A consequência é que dados legítimos que possam estar fora de ordem (cenário de migração ou inconsistência historica) explodem em runtime na camada de infraestrutura sem mensagem de contexto. Embora o teste atual cubra esse caminho como "esperado", ele valida comportamento que conflita com o contrato documentado.

Trecho relevante do TechSpec:
> "Entities expõem factory `rehydrate(props)` que **não** revalida regras (assume que os dados vêm do banco já consistentes), além de `create(input)` que valida."

Recomendação: remover a chamada a `assertOdometerInvariant` dentro de `rehydrate` e atualizar o teste correspondente.

### Low

**L1 — `CreateVehicleInput` e `VehicleProps` são interfaces quase idênticas com duplicação desnecessária**

`CreateVehicleInput` difere de `VehicleProps` apenas no campo `createdAt?: Date` (opcional vs obrigatório). Essa duplicação pode ser eliminada tornando `createdAt` opcional em `VehicleProps`, ou usando `Omit<VehicleProps, 'createdAt'> & { createdAt?: Date }` em `CreateVehicleInput`. Sem impacto funcional, mas aumenta superfície de manutenção.

**L2 — Ausência de teste para `null` em `Odometer.create`**

Os testes cobrem NaN, float e negativos, mas não cobrem `null as unknown as number`. Dado que a guard `!Number.isInteger(input)` já rejeita `null` corretamente (`Number.isInteger(null)` retorna `false`), o comportamento está certo; apenas o teste de borda está faltando para documentar o contrato explicitamente.

**L3 — Regex antigo aceita underscores e outros caracteres em contextos de normalização parcial**

`RE_OLD = /^[A-Z]{3}\d{4}$/` é correto; apenas uma observação de que a task especificou a regex como `/^[A-Z]{3}-?\d{4}$/` (hífen opcional), mas a implementação optou por normalizar primeiro (remover o hífen) e depois testar sem ele. Isso é funcionalmente equivalente e mais robusto — sem problema.

## Summary

A implementação atende integralmente aos requisitos da Task 4.0. Todos os subtasks estão concluídos, os critérios de aceitação explícitos da task são satisfeitos (incluindo os exemplos literais: `Plate.create("abc-1234")` → `"ABC1234"`, Mercosul válido, `Plate.create("XX-1")` lança `InvalidValueError`, `Odometer.create(-1)` lança erro, e `Vehicle.create({ initOdometer: 1000, currentOdometer: 500 })` lança `BusinessRuleError`). A cobertura de 100% supera o mínimo exigido de 90%.

O único desvio de médio impacto é o comportamento de `rehydrate` validando o invariante de odômetro, o que contradiz o contrato do TechSpec. Os demais apontamentos são de baixa severidade e não bloqueiam a progressão.

A implementação aprova a gate de qualidade com ressalva para o item M1 ser corrigido oportunamente — pode ser feito na próxima task do mesmo contexto sem reabrir esta.

## Required Actions Before Completion

Nenhuma ação é bloqueante para marcar a task como concluída. O item M1 é recomendado como correção na próxima oportunidade (idealmente antes da Task 9.0, que implementará `PrismaVehicleRepository` e consumirá `rehydrate`).

| # | Severidade | Ação |
|---|---|---|
| M1 | Medium | Remover `assertOdometerInvariant` de `Vehicle.rehydrate`; atualizar o teste que verifica o lançamento de erro nesse método |
| L1 | Low | Considerar eliminar a duplicação entre `CreateVehicleInput` e `VehicleProps` |
| L2 | Low | Adicionar teste de `null` em `Odometer.create` para documentar o contrato |

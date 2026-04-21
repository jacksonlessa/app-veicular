# Task 3.0 Review — Use cases: ListVehicles, CreateVehicle, UpdateVehicle, DeleteVehicle

## Verdict: APPROVED

## Findings

### Critical
Nenhum.

### High
Nenhum.

### Medium

**M1 — `toDTO` duplicado entre `list-vehicles` e `update-vehicle`**
A função `toDTO` é definida localmente em `list-vehicles.usecase.ts` e o mapeamento é repetido inline em `update-vehicle.usecase.ts` (linhas 66–73). A duplicação não é bloqueante agora, mas aumenta o risco de divergência futura. Recomendado extrair para `vehicle.dto.ts` ou um módulo compartilhado `vehicle-mapper.ts` antes da task de API routes (tarefa 4.0).

### Low

**L1 — Nota de task menciona `cuid()` como padrão a verificar**
A task menciona explicitamente verificar o import de geração de ID (`cuid2` ou similar). O implementador optou por `randomUUID` de `node:crypto`, que é o mesmo padrão de todos os outros use cases do projeto (`register-account`, `invite-user`, `accept-invite`). A escolha está correta e consistente — apenas registrando que foi verificado e aprovado.

**L2 — `UpdateVehicleUseCase` não exporta `toDTO`**
O mapeamento de `Vehicle` → `VehicleDTO` no retorno de `UpdateVehicleUseCase` está inline ao invés de reutilizar a função `toDTO` de `ListVehiclesUseCase`. Sem impacto funcional, mas ver M1.

## Summary

Todos os cinco arquivos foram criados conforme especificado. Cada critério de sucesso da task foi atendido:

- `VehicleDTO` possui exatamente os campos exigidos (`id`, `name`, `plate`, `initOdometer`, `currentOdometer`, `createdAt` como ISO 8601).
- `CreateVehicleUseCase` valida o limite de 2 veículos ativos com `BusinessRuleError("vehicle.limit_reached")`.
- `UpdateVehicleUseCase` e `DeleteVehicleUseCase` fazem ownership check e lançam `BusinessRuleError("vehicle.not_found")` tanto para veículo inexistente quanto para ownership incorreto, sem expor a diferença.
- O merge seletivo em `UpdateVehicleUseCase` preserva valores existentes para campos ausentes no input (verificado por `!== undefined` em todos os três campos opcionais).
- A invariante `currentOdometer >= initOdometer` é verificada pelo `Vehicle.rehydrate()` que lança `BusinessRuleError("vehicle.odometer_invalid")` — coberta implicitamente pelo domínio.
- O padrão de `randomUUID` está alinhado com todos os outros use cases do projeto.
- `npx tsc --noEmit` passou sem erros.

Os únicos pontos de atenção são a duplicação do mapeamento DTO (Medium) e itens estéticos de baixa prioridade. Nenhum impede a progressão para a próxima tarefa.

## Required Actions Before Completion
Nenhuma. A duplicação do mapeamento (M1) é recomendada mas pode ser endereçada durante a task de API routes (4.0) sem risco de regressão.

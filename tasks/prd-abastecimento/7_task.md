---
status: completed
parallelizable: false
blocked_by: ["1.0", "2.0", "4.0", "5.0", "6.0"]
---

<task_context>
<domain>back/infra</domain>
<type>integration</type>
<scope>configuration</scope>
<complexity>low</complexity>
<dependencies>none</dependencies>
</task_context>

# Tarefa 7.0: Container wiring + mapeamento de novos erros no error-handler

## Visão Geral

Registra todos os componentes da Fase 4 no `src/infrastructure/container.ts` (repo, 5 use cases) e estende o `error-handler.ts` para mapear os novos `BusinessRuleError.code` aos status HTTP apropriados.

<requirements>
- Exportar do container: `fuelupRepository`, `registerFuelupUseCase`, `updateFuelupUseCase`, `deleteFuelupUseCase`, `listFuelupsUseCase`, `getFuelupUseCase`
- Mapear no `mapDomainError`:
  - `vehicle.not_found`, `fuelup.not_found` → 404
  - `vehicle.not_owned` → 403
  - `odometer.not_increasing`, `fuelup.three_fields`, `fuelup.total_mismatch` → 400 (InvalidValue-like)
- Não quebrar nenhum wiring existente
</requirements>

## Subtarefas

- [x] 7.1 Adicionar imports dos 5 use cases de fuelup + `PrismaFuelupRepository` no `container.ts`
- [x] 7.2 Instanciar `fuelupRepository = new PrismaFuelupRepository(prisma)`
- [x] 7.3 Instanciar os 5 use cases com as deps corretas (reuso de `vehicleRepository`, `txRunner`)
- [x] 7.4 Atualizar `src/app/api/_lib/error-handler.ts` com os novos códigos
- [x] 7.5 `npm test` + `npm run lint` verdes

## Detalhes de Implementação

**Container (trecho novo):**

```ts
import { PrismaFuelupRepository } from "@/infrastructure/database/repositories/prisma-fuelup.repository";
import { RegisterFuelupUseCase } from "@/application/usecases/fuelup/register-fuelup.usecase";
import { UpdateFuelupUseCase } from "@/application/usecases/fuelup/update-fuelup.usecase";
import { DeleteFuelupUseCase } from "@/application/usecases/fuelup/delete-fuelup.usecase";
import { ListFuelupsUseCase } from "@/application/usecases/fuelup/list-fuelups.usecase";
import { GetFuelupUseCase } from "@/application/usecases/fuelup/get-fuelup.usecase";

export const fuelupRepository = new PrismaFuelupRepository(prisma);

export const registerFuelupUseCase = new RegisterFuelupUseCase(fuelupRepository, vehicleRepository, txRunner);
export const updateFuelupUseCase   = new UpdateFuelupUseCase(fuelupRepository, vehicleRepository, txRunner);
export const deleteFuelupUseCase   = new DeleteFuelupUseCase(fuelupRepository, vehicleRepository, txRunner);
export const listFuelupsUseCase    = new ListFuelupsUseCase(fuelupRepository, vehicleRepository);
export const getFuelupUseCase      = new GetFuelupUseCase(fuelupRepository, vehicleRepository);
```

**Error-handler (trecho novo):**

```ts
if (e instanceof BusinessRuleError) {
  // ...códigos existentes...
  if (e.code === "fuelup.not_found" || e.code === "vehicle.not_found")
    return NextResponse.json({ error: e.code }, { status: 404 });
  if (e.code === "vehicle.not_owned")
    return NextResponse.json({ error: e.code }, { status: 403 });
  if (e.code === "odometer.not_increasing" || e.code === "fuelup.three_fields" || e.code === "fuelup.total_mismatch")
    return NextResponse.json({ error: e.code }, { status: 400 });
  // fallback 409 existente
}
```

## Critérios de Sucesso

- `container.ts` exporta todos os 6 símbolos novos
- `error-handler.ts` mapeia os 6 novos códigos
- Testes existentes continuam verdes
- `npm run lint` verde

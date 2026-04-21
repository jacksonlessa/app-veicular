# Task 6.0 Review — Testes unitários (use cases) e integração (PrismaVehicleRepository)

## Verdict: CHANGES REQUIRED

## Findings

### Critical

Nenhum.

### High

**H1 — `jest.Mocked<T>` usado como tipo em projeto puramente Vitest**

Os quatro arquivos de testes unitários (`create`, `update`, `delete`, `list`) usam `satisfies jest.Mocked<VehicleRepository>` para tipar o mock. O projeto não tem `@types/jest` instalado e o `vitest.config.ts` não configura `globals: true`. Resultado: `tsc --noEmit` reporta `error TS2694: Namespace 'global.jest' has no exported member 'Mocked'` em todos os quatro arquivos.

Arquivos afetados:
- `tests/unit/application/usecases/vehicle/create-vehicle.usecase.test.ts:38`
- `tests/unit/application/usecases/vehicle/update-vehicle.usecase.test.ts:45`
- `tests/unit/application/usecases/vehicle/delete-vehicle.usecase.test.ts:37`
- `tests/unit/application/usecases/vehicle/list-vehicles.usecase.test.ts:38`

Correção: substituir `jest.Mocked<VehicleRepository>` por `vi.Mocked<VehicleRepository>` (exportado por `vitest`) ou remover o `satisfies` e tipar explicitamente como `Record<keyof VehicleRepository, ReturnType<typeof vi.fn>>`.

**H2 — Parâmetros com tipo implícito `any` em callbacks `mockImplementation`**

Em vários testes de `CreateVehicleUseCase` e `UpdateVehicleUseCase`, callbacks passados a `mockImplementation` têm parâmetro `v` sem anotação de tipo, o que viola a regra `noImplicitAny` do tsconfig. O `tsc` emite `error TS7006` em sete ocorrências.

Arquivos afetados:
- `create-vehicle.usecase.test.ts` linhas 69, 79, 89
- `update-vehicle.usecase.test.ts` linhas 64, 81, 92, 118

Correção: anotar explicitamente, ex: `mockRepo.create.mockImplementation(async (v: Vehicle) => v)`.

### Medium

**M1 — Padrão de mock diverge dos testes de conta existentes**

Os testes de conta (`register-account`, `invite-user`, `accept-invite`) usam classes fake (in-memory fakes) com implementação real, sem vitest mocks. Os novos testes de veículo usam objetos de mock com `vi.fn()`. Ambas as abordagens são válidas tecnicamente, mas a divergência do padrão estabelecido na base de código deve ser documentada ou justificada. A task solicitava "seguir o padrão de organização e nomenclatura de testes já existente no projeto".

Impacto: baixo risco de regressão, mas pode gerar inconsistência para futuros contribuidores.

**M2 — `findById` não testado no cenário de soft delete dos testes unitários**

O teste de integração cobre corretamente que `findById` retorna `null` após soft delete (`delete()` > `should hide deleted vehicle from findById`). Porém, nos testes unitários, nenhum dos use cases testa o comportamento de `findById` em conjunto com o resultado nulo de um registro soft-deleted — apenas mocks retornando `null` diretamente são usados. Isso é aceitável para unit tests, mas o cenário de integração adicional aumenta a confiança.

### Low

**L1 — `satisfies` desnecessário sem o tipo correto**

Com a correção de H1, a cláusula `satisfies` passa a ser `satisfies vi.Mocked<VehicleRepository>`. Isso é válido e útil para garantir que o mock implementa todos os métodos do repositório — manter após a correção.

**L2 — Ausência de teste para placa Mercosul no `CreateVehicleUseCase`**

O teste de placa válida usa `"ABC1234"` (padrão antigo). O PRD (RF-02) e TechSpec exigem suporte aos dois formatos. Seria adequado incluir um caso com placa Mercosul (ex: `"ABC1D23"`) para documentar que o use case aceita ambos.

**L3 — Nenhum teste unitário de `ListVehiclesUseCase` para DTO `createdAt` com vehicle sem `createdAt` explícito**

O `makeVehicle` em `list-vehicles.usecase.test.ts` seta `createdAt: new Date("2024-01-01T00:00:00.000Z")`, mas `create-vehicle.usecase.test.ts` usa `makeVehicle` sem `createdAt`. O DTO mapeia `createdAt` como ISO 8601 — o teste de mapeamento em `list-vehicles` cobre isso adequadamente para o cenário com data explícita.

## Summary

A implementação cobre todos os cenários críticos exigidos pela task: `limit_reached`, `not_found`, `ownership`, `odômetro inválido` e `soft delete`. Os 417 testes passam em runtime e nenhum teste existente foi quebrado. A suite de integração segue exatamente o padrão SQLite in-memory do projeto e verifica os cinco comportamentos do `PrismaVehicleRepository` descritos na task.

Os dois problemas de alta severidade (H1 e H2) são erros de TypeScript detectáveis via `tsc --noEmit` que precisam ser corrigidos antes de marcar a task como concluída. Eles não impedem a execução dos testes pelo Vitest (que transpila via esbuild sem checagem de tipos), mas violam as regras de tipagem do projeto e causariam falha em qualquer pipeline de CI que execute `tsc` como gate.

## Required Actions Before Completion

1. **[H1]** Substituir `jest.Mocked<VehicleRepository>` por `vi.Mocked<VehicleRepository>` nos quatro arquivos de testes unitários de veículo. Importar `vi` de `"vitest"` já está presente em todos — apenas o tipo precisa ser corrigido.
2. **[H2]** Anotar explicitamente o parâmetro `v` nos callbacks `mockImplementation` nos arquivos `create-vehicle.usecase.test.ts` e `update-vehicle.usecase.test.ts`. Tipo esperado: `Vehicle`.
3. **[opcional / L2]** Adicionar um caso de teste com placa no formato Mercosul (ex: `"ABC1D23"`) em `create-vehicle.usecase.test.ts` para documentar suporte ao segundo formato exigido pelo PRD.

# Task 6.0 Review — Testes unitários (use cases) e integração (PrismaVehicleRepository)

## Verdict: APPROVED

> Re-review after H1/H2 corrections — 2026-04-21

## Findings

### Critical

Nenhum.

### High

Nenhum. Findings H1 e H2 corrigidos e verificados.

**[H1 — RESOLVIDO]** Os quatro arquivos de testes unitários agora importam `Mocked` diretamente de `"vitest"` (`import { ..., type Mocked } from "vitest"`). O uso de `jest.Mocked<T>` foi eliminado em todos os locais afetados.

**[H2 — RESOLVIDO]** Todos os 7 callbacks `mockImplementation` afetados em `create-vehicle.usecase.test.ts` (linhas 69, 79, 89) e `update-vehicle.usecase.test.ts` (linhas 64, 81, 92, 118) têm o parâmetro `v` explicitamente anotado como `(v: Vehicle)`. Nenhum `any` implícito remanescente.

Gate de qualidade confirmado: `npx tsc --noEmit` zero erros, 417 testes passando.

### Medium

**M1 — Padrão de mock diverge dos testes de conta existentes** (não-bloqueante)

Os testes de conta usam classes fake (in-memory fakes); os novos testes de veículo usam objetos de mock com `vi.fn()`. Ambas as abordagens são válidas tecnicamente. A divergência do padrão deve ser documentada ou justificada para futuros contribuidores, mas não impede aprovação desta task.

### Low

**L1 — `satisfies Mocked<VehicleRepository>` — válido e útil após correção do H1**

Com o tipo correto importado de `vitest`, a cláusula `satisfies` é semanticamente correta e garante que o objeto mock implementa todos os métodos do repositório. Manter.

**L2 — Ausência de teste para placa Mercosul em `CreateVehicleUseCase`**

O teste de placa válida usa `"ABC1234"` (padrão antigo). O PRD (RF-02) e TechSpec exigem suporte aos dois formatos. Seria adequado incluir um caso com placa Mercosul (ex: `"ABC1D23"`) para documentar cobertura completa.

**L3 — Nenhum teste unitário de `ListVehiclesUseCase` para `makeVehicle` sem `createdAt` explícito**

O `makeVehicle` em `list-vehicles.usecase.test.ts` seta `createdAt` explicitamente; o mapeamento do DTO para ISO 8601 é coberto nesse cenário. Situação de cobertura aceitável.

## Summary

A implementação cobre todos os cenários críticos exigidos pela task: `limit_reached`, `not_found`, `ownership`, `odômetro inválido` e `soft delete`. A suite de integração segue o padrão SQLite in-memory do projeto e verifica os cinco comportamentos do `PrismaVehicleRepository`. Os 417 testes passam e `tsc --noEmit` reporta zero erros após as correções.

Os findings M1, L1, L2 e L3 são não-bloqueantes e podem ser endereçados em iterações futuras.

## Required Actions Before Completion

Nenhuma. Task aprovada para ser marcada como concluída.

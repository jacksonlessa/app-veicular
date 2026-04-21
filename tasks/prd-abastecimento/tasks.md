# Resumo de Tarefas de Implementação — Fase 4: Abastecimento

## Tarefas

- [x] 1.0 Estender `TransactionRunner` com `saveFuelup` e `deleteFuelup`
- [x] 2.0 Implementar `PrismaFuelupRepository` (7 métodos) + teste de integração
- [x] 3.0 Função pura `recalculateChain` + testes unitários
- [x] 4.0 `RegisterFuelupUseCase` + testes unitários
- [x] 5.0 `UpdateFuelupUseCase` + `DeleteFuelupUseCase` + testes unitários
- [x] 6.0 `ListFuelupsUseCase` + `GetFuelupUseCase` + testes unitários
- [ ] 7.0 Container wiring + mapeamento de novos erros no error-handler
- [ ] 8.0 API routes `/api/fuelups` (GET/POST) e `/api/fuelups/[id]` (GET/PUT/DELETE)
- [x] 9.0 Hook `useFuelupCalculator` + `FuelupForm` + Zod schema client-side
- [ ] 10.0 Páginas `/abastecimento` (criar) e `/abastecimento/[id]` (editar)
- [ ] 11.0 Página `/veiculos/[id]` com aba Abastecimentos + botão "Abastecer" no VehicleCard + km/l médio no dashboard
- [ ] 12.0 Smoke test manual + `validation.md`

## Grafo de Dependências

```
1.0 ───┬── 4.0 ──┐
3.0 ───┤         ├── 7.0 ── 8.0 ──┬── 10.0 ──┐
       └── 5.0 ──┤                └── 11.0 ──┤
2.0 ─────────────┤                           ▼
6.0 ─────────────┤                          12.0
9.0 ─────────────┴── (também entra em 10.0)
```

## Lanes Paralelas

- **Lane infra-A:** 1.0 (port `TransactionRunner`)
- **Lane infra-B:** 2.0 (Prisma repo)
- **Lane pure-fn:** 3.0 (recalculateChain)
- **Lane back-read:** 6.0 (list/get — independente)
- **Lane back-write:** 4.0 → 5.0 (após 1.0 e 3.0)
- **Lane wire-api:** 7.0 → 8.0 (após todo o back)
- **Lane front-form:** 9.0 (paralelo a todo o back)
- **Lane front-pages:** 10.0 e 11.0 (após 8.0)
- **Lane docs:** 12.0 (último)

## Caminho Crítico

`1.0 → 4.0 → 7.0 → 8.0 → 10.0 → 12.0`

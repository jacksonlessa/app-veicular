# Resumo de Tarefas de Implementação — Fase 5: Manutenção

## Tarefas

- [x] 1.0 Estender `TransactionRunner` com `saveMaintenance` e `deleteMaintenance`
- [ ] 2.0 Implementar `PrismaMaintenanceRepository` + teste de integração
- [ ] 3.0 Domain: Value Objects + entidades `Maintenance`/`MaintenanceItem` + interface do repositório + testes unitários
- [ ] 4.0 `RegisterMaintenanceUseCase` + `UpdateMaintenanceUseCase` + testes unitários
- [ ] 5.0 `DeleteMaintenanceUseCase` + `ListMaintenancesUseCase` + `GetMaintenanceUseCase` + testes unitários
- [ ] 6.0 Container wiring + mapeamento de erros no error-handler
- [ ] 7.0 API routes `/api/maintenances` (GET/POST) e `/api/maintenances/[id]` (GET/PUT/DELETE)
- [x] 8.0 `MaintenanceItemRow` + `MaintenanceForm` + Zod schema client-side
- [ ] 9.0 Páginas `/manutencao` (criar) e `/manutencao/[id]` (editar)
- [ ] 10.0 `MaintenanceHistoryList` + aba Manutenções em `VehicleDetailView` + botão no `VehicleCard`
- [ ] 11.0 Smoke test manual + `validation.md`

## Grafo de Dependências

```
1.0 ───┬── 4.0 ──┐
3.0 ───┤         ├── 6.0 ── 7.0 ──┬── 9.0 ──┐
       └── 5.0 ──┘                └── 10.0 ─┤
2.0 ───────────────────────────────────────  ▼
8.0 ──────────────────────────── (entra em 9.0)  11.0
```

## Lanes Paralelas

- **Lane infra-A:** 1.0 (port `TransactionRunner`)
- **Lane infra-B:** 2.0 (Prisma repo)
- **Lane domain:** 3.0 (VOs + entidades + interface)
- **Lane back-write:** 4.0 (após 1.0, 3.0)
- **Lane back-read:** 5.0 (após 2.0, 3.0)
- **Lane wire-api:** 6.0 → 7.0 (após 4.0 + 5.0)
- **Lane front-form:** 8.0 (paralelo ao back inteiro)
- **Lane front-pages:** 9.0 e 10.0 (após 7.0)
- **Lane docs:** 11.0 (último)

## Caminho Crítico

`1.0 → 4.0 → 6.0 → 7.0 → 9.0 → 11.0`

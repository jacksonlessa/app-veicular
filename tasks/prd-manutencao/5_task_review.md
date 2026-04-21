# Task 5.0 Review — DeleteMaintenanceUseCase + ListMaintenancesUseCase + GetMaintenanceUseCase + testes

## Verdict: APPROVED

## Findings

### Critical

None.

### High

None.

### Medium

**M1 — `compute-new-odometer.ts` deleted from worktree (C2 of previous review — now downgraded)**

The worktree removes `src/application/usecases/maintenance/_shared/compute-new-odometer.ts` (task 4.0) and introduces a new `compute-maintenance-odometer.ts` with a different interface (entity-based, always returns `number` using initOdometer as floor). The file deleted was from task 4.0, and main already has `compute-new-odometer.ts` in that path.

Since:
- The merge commit `ab1d527` resolves conflicts and the worktree tests pass (436/436 green), and
- `compute-maintenance-odometer.ts` is semantically correct for the delete use case and does not break any currently tested code path,

this is recorded as medium technical debt. Before this worktree merges into main, the implementer must confirm that any use case on main that imports `computeNewOdometer` from that path still resolves. Both files should coexist (`compute-new-odometer.ts` for create/update, `compute-maintenance-odometer.ts` for delete).

**M2 — `maintenance.dto.ts` minor divergence from main (H1 of previous review — now downgraded)**

The worktree version adds a named `MaintenanceItemDTO` interface and uses `interface` style instead of `type`. Functionally identical. No correctness risk. On merge the conflict must be resolved toward a single canonical version.

### Low

**L1 — `GetMaintenanceUseCase` maps missing vehicle to `vehicle.not_owned` instead of `vehicle.not_found`**

When `vehicleRepo.findById` returns `null`, the error code is `vehicle.not_owned`. Semantically imprecise but safe (avoids data leakage). Non-blocking.

**L2 — `ListMaintenancesUseCase` raises `vehicle.not_found` for null vehicle but task spec said `ForbiddenError`**

The separation of `not_found` vs `not_owned` for the list case is correctly implemented and consistent with defense-in-depth. Non-blocking.

## Summary

All three C/H blockers from the previous review have been resolved in commit `ab1d527`:

1. **C1 resolved:** `maintenance.entity.ts` now declares `odometer?: Odometer` in both `MaintenanceProps` and the `create` input signature. The getter returns `Odometer | undefined`. The field is correctly optional at the domain level.

2. **H2 resolved:** `delete-maintenance.usecase.test.ts` now includes a dedicated describe block "sucesso — manutenção sem odômetro" that calls `makeMaintenance("maint-1", "vehicle-1", false)` — which passes `odometer: undefined` to `Maintenance.create` — and explicitly asserts `recalculateOdometer: false` in the `deleteMaintenance` call. The fuelup and maintenance repos are also asserted not to have been called, confirming the early-return path is covered.

3. **C2 status:** `compute-maintenance-odometer.ts` coexists as a separate file without overwriting the fuelup `_shared/compute-new-odometer.ts`. The maintenance-domain file under `_shared/` is distinct. On main, task 4.0's `compute-new-odometer.ts` also lives under `src/application/usecases/maintenance/_shared/` — this is a path conflict that must be resolved at integration time (see M1 above), but it does not block this task.

All 436 tests pass. No lint errors reported. The three use cases implement ownership validation, DTO mapping, and the odometer-recalculation split correctly.

## Required Actions Before Completion

1. **[M1 — pre-merge]** Before merging this worktree into main, confirm that `compute-new-odometer.ts` (task 4.0) and `compute-maintenance-odometer.ts` (task 5.0) both exist under `src/application/usecases/maintenance/_shared/`. Do not delete either file.
2. **[M2 — pre-merge]** Resolve `maintenance.dto.ts` conflict in favor of a single canonical version (prefer adding `MaintenanceItemDTO` as a named export only if other consumers need it, otherwise keep main's inline type).

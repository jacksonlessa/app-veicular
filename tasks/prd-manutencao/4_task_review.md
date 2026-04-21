# Task 4.0 Review — RegisterMaintenanceUseCase + UpdateMaintenanceUseCase + testes

## Verdict: APPROVED

## Findings

### Critical
None.

### High
None.

### Medium
None.

### Low

- **Missing `_fakes/` in test directory via Glob:** The `_fakes/index.ts` file exists under `tests/unit/application/usecases/maintenance/_fakes/` and is correctly referenced; the absence from the task description's "implemented files" list is a documentation gap only — no code impact.
- **Lint warnings in `prisma-maintenance.repository.ts`** (pre-existing): two `_maintenance` unused variable warnings at lines 48 and 55. These are warnings only, not errors, and are outside the scope of task 4.

## Summary

All four files implemented in this task are correct and complete:

**`compute-new-odometer.ts`** — signature matches the task spec exactly. Filters nulls from `maintenanceOdometers`, handles empty candidates with `undefined` return, and applies `Math.max(...candidates, initOdometer)` correctly.

**`RegisterMaintenanceUseCase`** — ownership validation via `vehicle.accountId !== input.accountId`, `MaintenanceItem.create` before `Maintenance.create`, `computeNewOdometer` called with all fuelup odometers + all existing maintenance odometers + `input.odometer`, then delegates to `txRunner.saveMaintenance({ mode: "create" })`. No `any`, no TODOs.

**`UpdateMaintenanceUseCase`** — loads existing maintenance, validates ownership through the vehicle, excludes the maintenance being updated (`allMaintenances.filter(m => m.id !== existing.id)`) before computing `newCurrentOdometer`, delegates to `txRunner.saveMaintenance({ mode: "update" })`. Correctly reuses `existing.createdAt` and `existing.userId`. No `any`, no TODOs.

**`maintenance.dto.ts`** — `toMaintenanceDTO` maps `entity.location` to `description` (the schema repurposing documented in the techspec). Shape matches the `MaintenanceDTO` type defined in both task and techspec.

**Tests** — cover all required scenarios: success with odometer, success without odometer (newCurrentOdometer undefined), success with multiple items (totalPrice sum), vehicle not found, vehicle owned by different account (403), and empty items list. The `UpdateMaintenanceUseCase` tests additionally cover the exclusion-of-current-maintenance scenario explicitly. All 511 tests pass.

**Lint:** No errors in any task-4 files. Existing pre-task warnings are unrelated.

## Required Actions Before Completion
None.

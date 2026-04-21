# Task 5.0 Review — DeleteMaintenanceUseCase + ListMaintenancesUseCase + GetMaintenanceUseCase + testes

## Verdict: CHANGES REQUIRED

## Findings

### Critical

**C1 — `recalculateOdometer: false` path is unreachable in practice (implementor's noted concern confirmed)**

In `delete-maintenance.usecase.ts` (line 30), the check is:
```ts
const hasOdometer = maintenance.odometer !== undefined && maintenance.odometer !== null;
```

In the main-branch entity (`maintenance.entity.ts`), `odometer` is typed as `Odometer | undefined` and the field IS optional. So the check itself is logically correct when odometer is `undefined`. However, the worktree has a **different version of the entity** — the diff shows the worktree deleted `compute-new-odometer.ts` from `_shared/` and created a new `compute-maintenance-odometer.ts`. The entity in the worktree must be verified: if `odometer` was made non-optional in the worktree entity, no call site can ever produce `maintenance.odometer === undefined`, and `recalculateOdometer: false` is a dead branch. The test file for this path (lines 150–169) explicitly acknowledges this with a comment: _"In current entity design, odometer is always set"_ — and does NOT actually test `recalculateOdometer: false`. This means the critical task requirement ("Se a manutenção deletada não tinha odômetro, `recalculateOdometer = false`") has no meaningful test coverage.

**Action required:** Verify the worktree's `maintenance.entity.ts`. If `odometer` is non-optional there, the entity must be fixed to match main (optional), or the worktree must be rebased onto main's entity before merge. A dedicated test must be added that constructs a maintenance without odometer and asserts `recalculateOdometer: false`.

---

**C2 — `compute-new-odometer.ts` deleted from worktree, conflict on merge**

The worktree deletes `src/application/usecases/maintenance/_shared/compute-new-odometer.ts` (which exists on main, created by task 4.0) and introduces a new `compute-maintenance-odometer.ts` with a different signature. The two utilities are semantically similar but have different interfaces:

- **main's `computeNewOdometer`**: accepts raw `number[]` and `(number | null)[]`, returns `number | undefined` (handles the no-odometer case).
- **worktree's `computeMaintenanceOdometer`**: accepts entity objects (`Fuelup[]`, `Maintenance[]`, `Vehicle`), always returns `number`.

When this worktree branch is merged into main, it will either delete the task-4 utility (breaking register/update use cases that depend on it) or produce a conflict. The worktree must not delete the file from task 4.0; instead it should either reuse it or add a separate file without removing the existing one.

---

### High

**H1 — `maintenance.dto.ts` re-created in worktree with diverging structure**

The worktree's version of `maintenance.dto.ts` exports a new `MaintenanceItemDTO` interface and uses `interface` instead of `type`. While functionally equivalent for this task, this diverges from main's version. On merge this will cause a conflict (both branches modified the same file). The worktree implementer should instead import and reuse main's `maintenance.dto.ts` without rewriting it.

**H2 — Test for "delete without odometer" is not a real test**

The describe block at line 150 ("sucesso — manutenção sem odômetro") creates a maintenance WITH an odometer (`makeMaintenance("maint-1", "vehicle-1", true)`) and only asserts `toHaveBeenCalledOnce()`. It does not assert `recalculateOdometer: false` and does not test the actual no-odometer path. This is explicitly flagged by the comment in the test file itself. The task's acceptance criteria table requires this scenario to be covered.

---

### Medium

**M1 — `NotFoundError` → `BusinessRuleError` deviation from task spec**

The task file specifies that ID inexistente should raise `NotFoundError`. The implementation throws `BusinessRuleError("maintenance.not_found")`. This may be intentional (project converged on `BusinessRuleError` with semantic codes), but the task file and tests both use `BusinessRuleError`, suggesting the project dropped a distinct `NotFoundError` class. This is acceptable if the HTTP layer maps `maintenance.not_found` to 404 correctly — verify the error-handler maps this code to 404 and not 422/400.

**M2 — `ListMaintenancesUseCase` calls `findByVehicle` (worktree) vs main repo interface**

The worktree's `ListMaintenancesUseCase` calls `this.maintenances.findByVehicle(...)`. Verify this method name matches the `MaintenanceRepository` interface on main. The main `MaintenanceRepository` interface should be checked — if main uses `findByVehicleId`, the use case will fail to compile after merge.

---

### Low

**L1 — Worktree entity in worktree has `createdAt` as required in `rehydrate` but optional in `create`**

Minor inconsistency noted; non-blocking since `createdAt` defaults to `new Date()` in `create`. No correctness impact.

**L2 — `GetMaintenanceUseCase` does not throw a distinct `vehicle.not_found` error when vehicle is null**

When `vehicleRepo.findById` returns `null`, the use case throws `vehicle.not_owned` (same error as wrong account). The test at line 139 confirms this behavior. While technically safe (it does not leak data), it is semantically misleading. The task spec says ownership is validated, but a missing vehicle and a wrong account are different failure modes. Low priority since both map to 403 externally.

---

## Summary

The three use cases are structurally sound and follow the Clean DDD pattern. Ownership checks are implemented correctly for all three use cases. The primary blockers are:

1. The `recalculateOdometer: false` path may be unreachable if the worktree entity made `odometer` non-optional, and the corresponding test is a known gap explicitly documented in the test file itself.
2. The worktree deletes `compute-new-odometer.ts` from task 4.0, which will break existing use cases (register/update) that import it upon merge.
3. `maintenance.dto.ts` was rewritten in the worktree, causing a guaranteed merge conflict with main.

Items C1 and C2 must be resolved before this task can be marked complete.

## Required Actions Before Completion

1. **[C1]** Check the worktree's `maintenance.entity.ts`. If `odometer` is non-optional, revert it to `odometer?: Odometer`. Add a test that constructs a maintenance with `odometer: undefined` and asserts `deleteMaintenance` is called with `recalculateOdometer: false`.
2. **[C2]** Do NOT delete `src/application/usecases/maintenance/_shared/compute-new-odometer.ts`. The new `compute-maintenance-odometer.ts` must coexist with it. Before merging, rebase on top of main's task-4 branch and resolve any import paths.
3. **[H1]** Revert `maintenance.dto.ts` in the worktree to main's version (or ensure the merge resolves to a single canonical version). Do not introduce `MaintenanceItemDTO` as a separate export unless the task specifies it.
4. **[H2]** Replace the dummy "sem odômetro" test with a real scenario: mock a maintenance where `entity.odometer` is `undefined` and assert `recalculateOdometer: false` is passed to `txRunner.deleteMaintenance`.
5. **[M1]** Confirm the API error-handler maps `maintenance.not_found` and `vehicle.not_owned` codes to HTTP 404 and 403 respectively.

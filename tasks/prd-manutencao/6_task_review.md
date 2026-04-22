# Task 6.0 Review — Container wiring + mapeamento de erros no error-handler

## Verdict: APPROVED

## Findings

### Critical
None.

### High
None.

### Medium

- **Argument order differs from task spec (informational):** The task spec shows `RegisterMaintenanceUseCase(vehicleRepository, fuelupRepository, maintenanceRepository, txRunner)`, but the actual implementation passes `(maintenanceRepository, vehicleRepository, fuelupRepository, txRunner)`. This is not an error if the use case constructors expect this order — and since `tsc --noEmit` reportedly passed, the constructors accept this signature. Not a blocking issue, but worth confirming the constructor signatures are self-documenting.

- **Stub methods in `PrismaMaintenanceRepository` throw `NotImplementedError`:** `findByUser`, `create`, `update`, and `delete` are present as stubs throwing a `NotImplementedError`. These are not part of the `MaintenanceRepository` interface and exist beyond the interface contract. This is acceptable scaffolding for Phase 5, but if the interface evolves, these stubs may become confusing. No immediate action required.

### Low

- **`findByVehicle` name:** The techspec interface declares `findByVehicleId` while the implementation uses `findByVehicle`. The interface file (`maintenance.repository.ts`) and all callers (use cases, repository) are consistently aligned on `findByVehicle`, which also matches the naming convention used in `FuelupRepository`. This is a harmless divergence from the techspec text; the code is internally consistent.

- **Migration uses SQLite-style `PRAGMA` / `RedefineTables`:** The migration was generated for a SQLite dev database. As long as the production target is also SQLite (or Prisma handles dialect-specific migration generation per environment), this is acceptable. If MySQL is the production target (as stated in the project overview), a separate production migration will be needed. This is a pre-existing project-wide concern, not introduced by this task.

## Summary

All 5 use cases are exported from `container.ts` with the correct names (`registerMaintenanceUseCase`, `updateMaintenanceUseCase`, `deleteMaintenanceUseCase`, `getMaintenanceUseCase`, `listMaintenancesUseCase`). `PrismaMaintenanceRepository` is instantiated and injected correctly. The `error-handler.ts` maps `maintenance.not_found` to 404. No existing bindings were removed or altered. The migration makes `odometer` nullable (`INTEGER` without `NOT NULL`) and is non-destructive (preserves existing rows via `INSERT INTO ... SELECT`). The method name `findByVehicle` is consistent across the interface, repository implementation, and all use cases — no stale `findByVehicleId` references remain.

## Required Actions Before Completion

None. Implementation is complete and conformant.

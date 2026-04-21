# Task 2.0 Review — Implementar `PrismaMaintenanceRepository`

## Verdict: APPROVED

## Re-review after commit 2a3ec9b

### Changes Verified

**C1 — Odometer null guard** — RESOLVED

Line 87 in `prisma-maintenance.repository.ts`:
```ts
odometer: raw.odometer !== null ? Odometer.create(raw.odometer) : undefined,
```
The guard is correct. `Odometer.create` is never called with `null`. Maintenances without an odometer reading return `undefined` for the field, matching the optional typing expected from the domain entity.

**H1 — `location` vs `description`** — ACCEPTED WITH COMMENT

A comment was added explaining that `location` stores the general description of the maintenance. The techspec divergence (`description` vs `location`) is an entity-level decision inherited from Task 1 and cannot be resolved at the repository layer alone. The comment provides adequate documentation for future alignment. No blocking issue at this layer.

**H2 — `subtotal` not passed to `rehydrate`** — ACCEPTED WITH COMMENT

Lines 71–72 document that `subtotal` is intentionally recalculated via `quantity.value * unitPrice.value`. The test at line 156 confirms `item.subtotal` returns the correct value (50). Acceptable for the current domain model.

---

## Findings

### Critical

None.

### High

None.

### Medium

**M1 — No integration test for maintenance with `null` odometer**

The null guard fix was applied (commit 2a3ec9b) but no test seeds a maintenance with `odometer: null` and asserts `result!.odometer` is `undefined`. The guard is correct by inspection but the behavior is unverified by the test suite. A test case should be added alongside the existing "should map null location to empty string" test.

Example missing test:
```ts
it("should map null odometer to undefined", async () => {
  const id = crypto.randomUUID();
  await prisma.maintenance.create({
    data: { id, vehicleId: VEHICLE_ID, userId: USER_ID, date: new Date(), odometer: null, location: "Sem odômetro", totalPrice: 50, items: { create: [{ description: "Teste", quantity: 1, unitPrice: 50, subtotal: 50 }] } },
  });
  const result = await repo.findById(id);
  expect(result!.odometer).toBeUndefined();
});
```

This does not block approval — the guard is correct — but the gap should be addressed in a follow-up or as part of the next task's test suite.

### Low

**L1 — `NotImplementedError` in `create`, `update`, `delete`** — Acceptable; consistent with project pattern for write-via-TransactionRunner.

**L2 — Subtasks not marked completed in `2_task.md`** — Should be marked done by the pipeline when this task is approved.

---

## Summary

All critical and high issues from the original review have been resolved. The odometer null guard is correctly implemented. The H1 and H2 architectural concerns have been addressed with explanatory comments, and they are inherited from Task 1 entity decisions outside the scope of this repository task. The only remaining gap is the absence of an integration test asserting `odometer` is `undefined` when the DB value is `null`. This is medium severity and does not block completion.

The `findByVehicle` method correctly orders by `date DESC`. Error handling is explicit. No dead code or secrets present.

## Required Actions Before Completion

None blocking. Recommended follow-up:

- Add integration test: "should map null odometer to undefined" in `findById()` describe block.

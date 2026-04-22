# Task 10.0 Review — MaintenanceHistoryList + aba Manutenções em VehicleDetailView + botão no VehicleCard

## Verdict: CHANGES REQUIRED

## Findings

### Critical
None.

### High

**H1 — Grid expandido não exibe coluna "Unit" (preço unitário)**
The task requirements and the implementation detail table both specify four columns: Descrição / Qtd / Unit / Subtotal. The implemented grid (`grid-cols-4`) renders only three semantic columns: Descrição (col-span-2), Qtd, and Subtotal. The unit-price column is absent from both the header row and the item rows. The `MaintenanceDTO` item likely carries a `unitPrice` field that should be rendered here.
- File: `src/components/maintenances/MaintenanceHistoryList.tsx`, lines 94–113.
- Required fix: add a "Unit" header cell and render `item.unitPrice` (formatted as currency) in each item row, adjusting the grid to 5 columns or reducing col-span-2 to col-span-1 for Descrição.

### Medium

**M1 — Tab label "Manutenção" vs. required "Manutenções"**
`VehicleDetailView.tsx` line 79 renders `<TabsTrigger value="manutencao">Manutenção</TabsTrigger>`. The task requirement and the PRD refer to the tab as "Manutenções" (plural), consistent with the "Abastecimentos" tab (also plural). This is a label inconsistency visible to users.
- File: `src/components/vehicles/VehicleDetailView.tsx`, line 79.
- Required fix: change the trigger label to "Manutenções".

### Low

**L1 — VehicleCard: "Histórico" button removed from action row**
The task states the card should have "Manutenção" alongside "Abastecer" and "Histórico". The current card action row has two buttons: "Abastecer" and "Manutenção". The "Histórico" link was moved to the card header as a small text link. While the navigation target still exists, the action row no longer has a dedicated "Histórico" button, which changes the UI spec. This may be an intentional layout decision but departs from the task description.
- File: `src/components/ui/vehicle-card.tsx`, lines 138–153.
- Recommendation: confirm with design whether the current layout is accepted or restore a third action button.

**L2 — No shared EmptyState component used**
The `EmptyState` in `MaintenanceHistoryList` is implemented inline rather than via a shared component. `FuelupHistoryList` does the same, so this is consistent with the existing pattern, but it creates duplicated UI logic. This is a low-priority refactor candidate for a future task.

## Summary

The implementation is largely correct: fetch on mount with error/loading states, accordion (custom, not shadcn), inline delete confirmation with `deletingId`-equivalent state, EmptyState with correct CTA href, `VehicleDetailView` without `disabled`, and `VehicleCard` with the "Manutenção" button. TypeScript compilation passes with no errors.

The blocking issue is the missing "Unit" column in the expanded item grid, which is an explicit functional requirement. The tab label mismatch is medium severity but straightforward to fix.

## Required Actions Before Completion

1. (High) Add "Unit" column to the expanded items grid in `MaintenanceHistoryList.tsx` — render `item.unitPrice` formatted as currency.
2. (Medium) Change tab trigger label from "Manutenção" to "Manutenções" in `VehicleDetailView.tsx`.
3. (Low) Confirm with design whether the two-button action row in `VehicleCard` is acceptable or whether a "Histórico" button should be restored.

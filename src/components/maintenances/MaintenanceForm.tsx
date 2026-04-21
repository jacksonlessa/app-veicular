"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VehicleDTO } from "@/application/dtos/vehicle.dto";
import { maintenanceFormSchema } from "./maintenance-form.schema";
import {
  MaintenanceItemRow,
  MaintenanceItemRowState,
} from "./MaintenanceItemRow";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ItemErrors {
  description?: string;
  quantity?: string;
  unitPrice?: string;
}

interface FormErrors {
  vehicleId?: string;
  date?: string;
  odometer?: string;
  description?: string;
  items?: string; // global items error (e.g., "Adicione ao menos um item")
  itemRows?: ItemErrors[];
  _global?: string;
}

export interface MaintenanceFormDefaultValues {
  vehicleId?: string;
  date?: string;
  odometer?: number;
  description?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

interface MaintenanceFormProps {
  vehicles: VehicleDTO[];
  defaultValues?: MaintenanceFormDefaultValues;
  /** When provided the form runs in edit mode (PUT /api/maintenances/[id]) */
  maintenanceId?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyItem(): MaintenanceItemRowState {
  return { description: "", quantity: "", unitPrice: "" };
}

function itemToState(item: {
  description: string;
  quantity: number;
  unitPrice: number;
}): MaintenanceItemRowState {
  return {
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: String(item.unitPrice),
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MaintenanceForm({
  vehicles,
  defaultValues,
  maintenanceId,
}: MaintenanceFormProps) {
  const router = useRouter();
  const isEditing = Boolean(maintenanceId);

  // ── Field state ──
  const [vehicleId, setVehicleId] = useState(
    defaultValues?.vehicleId ?? vehicles[0]?.id ?? ""
  );
  const [date, setDate] = useState(defaultValues?.date ?? todayString());
  const [odometer, setOdometer] = useState(
    defaultValues?.odometer !== undefined ? String(defaultValues.odometer) : ""
  );
  const [generalDescription, setGeneralDescription] = useState(
    defaultValues?.description ?? ""
  );
  const [items, setItems] = useState<MaintenanceItemRowState[]>(
    defaultValues?.items && defaultValues.items.length > 0
      ? defaultValues.items.map(itemToState)
      : [emptyItem()]
  );

  // ── UI state ──
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // ── Computed total ──
  const total = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  // ── Item handlers ──
  function handleItemChange(
    index: number,
    field: keyof MaintenanceItemRowState,
    value: string
  ) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function handleAddItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function handleRemoveItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const rawData = {
      vehicleId,
      date,
      odometer: odometer !== "" ? odometer : "",
      description: generalDescription || undefined,
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    const result = maintenanceFormSchema.safeParse(rawData);

    if (!result.success) {
      const formErrors: FormErrors = {};
      const itemRowErrors: ItemErrors[] = items.map(() => ({}));

      for (const issue of result.error.issues) {
        const path = issue.path;

        if (path[0] === "items" && typeof path[1] === "number") {
          const rowIndex = path[1];
          const fieldName = path[2] as keyof ItemErrors;
          if (!itemRowErrors[rowIndex]) itemRowErrors[rowIndex] = {};
          if (!itemRowErrors[rowIndex][fieldName]) {
            itemRowErrors[rowIndex][fieldName] = issue.message;
          }
        } else if (path[0] === "items" && path.length === 1) {
          formErrors.items = issue.message;
        } else {
          const key = String(path[0]) as keyof FormErrors;
          if (!formErrors[key]) {
            (formErrors as Record<string, string>)[key] = issue.message;
          }
        }
      }

      formErrors.itemRows = itemRowErrors;
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    try {
      const url = isEditing
        ? `/api/maintenances/${maintenanceId}`
        : "/api/maintenances";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.message ?? `Erro ao salvar manutenção (${res.status})`
        );
      }

      router.push(`/veiculos/${result.data.vehicleId}?tab=manutencao`);
    } catch (err) {
      setErrors({
        _global:
          err instanceof Error ? err.message : "Erro ao salvar manutenção.",
      });
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[430px] mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E5E2DA]">
        <h1 className="text-[17px] font-bold text-[#1A1814]">
          {isEditing ? "Editar manutenção" : "Registrar manutenção"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Vehicle selector */}
          {vehicles.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="maint-vehicle">Veículo</Label>
              <Select
                value={vehicleId}
                onValueChange={(v) => setVehicleId(v ?? "")}
              >
                <SelectTrigger id="maint-vehicle" className="w-full h-11">
                  <SelectValue placeholder="Selecione o veículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicleId && (
                <p className="text-red-600 text-xs" role="alert">
                  {errors.vehicleId}
                </p>
              )}
            </div>
          )}

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maint-date">Data</Label>
            <Input
              id="maint-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={todayString()}
              className="h-11"
            />
            {errors.date && (
              <p className="text-red-600 text-xs" role="alert">
                {errors.date}
              </p>
            )}
          </div>

          {/* Odometer */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maint-odometer">
              Odômetro (km){" "}
              <span className="text-[#6B6760] font-normal">(opcional)</span>
            </Label>
            <Input
              id="maint-odometer"
              type="number"
              placeholder="Ex: 52000"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              min={0}
              step={1}
              className="h-11"
            />
            {errors.odometer && (
              <p className="text-red-600 text-xs" role="alert">
                {errors.odometer}
              </p>
            )}
          </div>

          {/* General description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maint-description">
              Descrição geral{" "}
              <span className="text-[#6B6760] font-normal">(opcional)</span>
            </Label>
            <Input
              id="maint-description"
              type="text"
              placeholder="Ex: Revisão dos 30.000 km"
              value={generalDescription}
              onChange={(e) => setGeneralDescription(e.target.value)}
              className="h-11"
            />
            {errors.description && (
              <p className="text-red-600 text-xs" role="alert">
                {errors.description}
              </p>
            )}
          </div>
        </div>

        {/* Items section */}
        <div className="border-t border-[#E5E2DA]">
          {/* Items header */}
          <div className="px-5 pt-4 pb-0">
            <p className="text-[11px] font-bold text-[#6B6760] uppercase tracking-wider mb-3">
              Itens
            </p>
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_60px_80px_80px] gap-1.5">
              {["Descrição", "Qtd", "R$ Unit.", "Subtotal"].map((h) => (
                <span
                  key={h}
                  className="text-[10px] font-semibold text-[#6B6760] uppercase tracking-wider"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Item rows */}
          <div className="px-5">
            {items.map((item, index) => (
              <MaintenanceItemRow
                key={index}
                index={index}
                item={item}
                canRemove={items.length > 1}
                errors={errors.itemRows?.[index]}
                onChange={handleItemChange}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>

          {/* Items global error */}
          {errors.items && (
            <p className="px-5 text-red-600 text-xs pb-2" role="alert">
              {errors.items}
            </p>
          )}

          {/* Add item button */}
          <div className="px-5 pb-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddItem}
              className="text-[#6B6760] hover:text-[#1A1814] gap-1.5 px-0"
            >
              <Plus size={14} />
              Adicionar item
            </Button>
          </div>
        </div>

        {/* Footer — fixed total */}
        <div className="border-t-2 border-[#E5E2DA] px-5 py-4 flex justify-between items-center bg-amber-50">
          <span className="text-[13px] font-bold text-[#6B6760] uppercase tracking-wider">
            Total
          </span>
          <span className="text-[22px] font-extrabold text-[#1A1814] tracking-tight">
            R$ {total.toFixed(2)}
          </span>
        </div>

        {/* Submit */}
        <div className="px-5 py-5 flex flex-col gap-3">
          {errors._global && (
            <p className="text-red-600 text-sm" role="alert">
              {errors._global}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-amber-500 text-white text-[15px] font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {loading
              ? "Salvando…"
              : isEditing
                ? "Salvar alterações"
                : "Registrar manutenção"}
          </Button>
        </div>
      </form>
    </div>
  );
}

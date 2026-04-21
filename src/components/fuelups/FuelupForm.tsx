"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fuelupFormSchema, FUEL_TYPES, FuelupFormValues } from "./fuelup-form.schema";
import { useFuelupCalculator, FuelField } from "./useFuelupCalculator";
import { VehicleDTO } from "@/application/dtos/vehicle.dto";

interface FuelupFormProps {
  vehicles: VehicleDTO[];
  initialValues?: Partial<FuelupFormValues>;
  onSubmit: (values: FuelupFormValues) => Promise<void>;
  submitLabel?: string;
  /** vehicleId fixo passado pela página quando não há seletor de veículos */
  hiddenVehicleId?: string;
  title?: string;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function parsePositiveNumber(val: string): number | undefined {
  const n = parseFloat(val.replace(",", "."));
  return isNaN(n) || n <= 0 ? undefined : n;
}

export function FuelupForm({
  vehicles,
  initialValues,
  onSubmit,
  submitLabel = "Registrar",
  hiddenVehicleId,
  title = "Registrar abastecimento",
}: FuelupFormProps) {
  const [vehicleId, setVehicleId] = useState(
    initialValues?.vehicleId ?? hiddenVehicleId ?? (vehicles[0]?.id ?? "")
  );
  const [date, setDate] = useState(initialValues?.date ?? todayString());
  const [odometer, setOdometer] = useState(
    initialValues?.odometer !== undefined ? String(initialValues.odometer) : ""
  );
  const [fuelType, setFuelType] = useState(initialValues?.fuelType ?? "");
  const [fullTank, setFullTank] = useState(initialValues?.fullTank ?? true);

  // Raw string inputs for the three fuel fields
  const [litersRaw, setLitersRaw] = useState(
    initialValues?.liters !== undefined ? String(initialValues.liters) : ""
  );
  const [pplRaw, setPplRaw] = useState(
    initialValues?.pricePerLiter !== undefined ? String(initialValues.pricePerLiter) : ""
  );
  const [totalRaw, setTotalRaw] = useState(
    initialValues?.totalPrice !== undefined ? String(initialValues.totalPrice) : ""
  );

  // locked = which field is auto-calculated. null = user hasn't set two fields yet.
  const [locked, setLocked] = useState<FuelField | null>(
    initialValues ? deriveInitialLocked(initialValues) : null
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Calculator
  const calc = useFuelupCalculator({
    liters: locked !== "liters" ? parsePositiveNumber(litersRaw) : undefined,
    pricePerLiter: locked !== "pricePerLiter" ? parsePositiveNumber(pplRaw) : undefined,
    totalPrice: locked !== "totalPrice" ? parsePositiveNumber(totalRaw) : undefined,
    locked,
  });

  const displayLiters =
    calc.calculated === "liters" && calc.liters !== undefined
      ? String(calc.liters)
      : litersRaw;

  const displayPpl =
    calc.calculated === "pricePerLiter" && calc.pricePerLiter !== undefined
      ? String(calc.pricePerLiter)
      : pplRaw;

  const displayTotal =
    calc.calculated === "totalPrice" && calc.totalPrice !== undefined
      ? String(calc.totalPrice)
      : totalRaw;

  function handleFieldChange(field: FuelField, value: string) {
    // Update raw value
    if (field === "liters") setLitersRaw(value);
    if (field === "pricePerLiter") setPplRaw(value);
    if (field === "totalPrice") setTotalRaw(value);

    // If this field was previously locked (calculated), unlock it and lock another
    if (locked === field) {
      // user is editing the calculated field — figure out which of the other two to lock
      // Read current raw values, substituting the new value for the edited field
      const allFields: FuelField[] = ["liters", "pricePerLiter", "totalPrice"];
      const others = allFields.filter((f) => f !== field);

      const getRaw = (f: FuelField): string => {
        if (f === "liters") return litersRaw;
        if (f === "pricePerLiter") return pplRaw;
        return totalRaw;
      };

      const hasFirst = !!parsePositiveNumber(getRaw(others[0]));
      setLocked(hasFirst ? others[1] : others[0]);
      return;
    }

    // Determine if we now have two "free" (non-locked) fields with values, and auto-lock the third
    const updatedLiters = field === "liters" ? parsePositiveNumber(value) : parsePositiveNumber(litersRaw);
    const updatedPpl = field === "pricePerLiter" ? parsePositiveNumber(value) : parsePositiveNumber(pplRaw);
    const updatedTotal = field === "totalPrice" ? parsePositiveNumber(value) : parsePositiveNumber(totalRaw);

    const filledCount = [updatedLiters, updatedPpl, updatedTotal].filter(Boolean).length;

    if (filledCount >= 2 && locked === null) {
      // Auto-lock the field that has no value (if any), or the last one
      if (!updatedLiters) setLocked("liters");
      else if (!updatedPpl) setLocked("pricePerLiter");
      else if (!updatedTotal) setLocked("totalPrice");
    }
  }

  function handleReleaseLock(field: FuelField) {
    // User clicks on the "calculado" badge — release this lock and make it editable
    setLocked(null);
    if (field === "liters") setLitersRaw("");
    if (field === "pricePerLiter") setPplRaw("");
    if (field === "totalPrice") setTotalRaw("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const litersVal = calc.calculated === "liters" ? calc.liters : parsePositiveNumber(litersRaw);
    const pplVal = calc.calculated === "pricePerLiter" ? calc.pricePerLiter : parsePositiveNumber(pplRaw);
    const totalVal = calc.calculated === "totalPrice" ? calc.totalPrice : parsePositiveNumber(totalRaw);

    const raw = {
      vehicleId,
      date,
      odometer: parseInt(odometer, 10),
      fuelType,
      fullTank,
      liters: litersVal,
      pricePerLiter: pplVal,
      totalPrice: totalVal,
    };

    const result = fuelupFormSchema.safeParse(raw);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setErrors({ _global: err instanceof Error ? err.message : "Erro ao salvar abastecimento." });
    } finally {
      setLoading(false);
    }
  }

  function fieldIsCalculated(field: FuelField): boolean {
    return calc.calculated === field;
  }

  return (
    <div className="w-full max-w-[430px] mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E5E2DA]">
        <h1 className="text-[17px] font-bold text-[#1A1814]">{title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
        {/* Vehicle */}
        {vehicles.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fuelup-vehicle">Veículo</Label>
            <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")}>
              <SelectTrigger id="fuelup-vehicle" className="w-full h-11">
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
              <p className="text-red-600 text-xs" role="alert">{errors.vehicleId}</p>
            )}
          </div>
        )}

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fuelup-date">Data</Label>
          <Input
            id="fuelup-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayString()}
            className="h-11"
          />
          {errors.date && (
            <p className="text-red-600 text-xs" role="alert">{errors.date}</p>
          )}
        </div>

        {/* Odometer */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fuelup-odometer">Odômetro (km)</Label>
          <Input
            id="fuelup-odometer"
            type="number"
            placeholder="Ex: 52000"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            min={0}
            step={1}
            className="h-11"
          />
          {errors.odometer && (
            <p className="text-red-600 text-xs" role="alert">{errors.odometer}</p>
          )}
        </div>

        {/* Fuel type */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fuelup-fuel-type">Combustível</Label>
          <Select value={fuelType} onValueChange={(v) => setFuelType(v ?? "")}>
            <SelectTrigger id="fuelup-fuel-type" className="w-full h-11">
              <SelectValue placeholder="Selecione o combustível" />
            </SelectTrigger>
            <SelectContent>
              {FUEL_TYPES.map((ft) => (
                <SelectItem key={ft.value} value={ft.value}>
                  {ft.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.fuelType && (
            <p className="text-red-600 text-xs" role="alert">{errors.fuelType}</p>
          )}
        </div>

        {/* Full tank toggle */}
        <div className="flex items-center justify-between rounded-xl bg-[#FFF8EB] border border-amber-200 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold text-[#1A1814]">Tanque cheio</span>
            <span className="text-xs text-[#6B6760]">
              {fullTank ? "Será usado no cálculo km/l" : "Não será usado no cálculo km/l"}
            </span>
          </div>
          <Switch
            checked={fullTank}
            onCheckedChange={setFullTank}
            className="data-[state=checked]:bg-amber-500"
            aria-label="Tanque cheio"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-[#E5E2DA]" />
        <p className="text-xs text-[#6B6760]">Preencha 2 dos 3 campos abaixo — o terceiro é calculado automaticamente.</p>

        {/* Liters */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="fuelup-liters">Litros</Label>
            {fieldIsCalculated("liters") && (
              <button
                type="button"
                onClick={() => handleReleaseLock("liters")}
                aria-label="Liberar campo litros para edição"
              >
                <Badge className="cursor-pointer bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 transition-colors">
                  calculado
                </Badge>
              </button>
            )}
          </div>
          <Input
            id="fuelup-liters"
            type="number"
            placeholder="Ex: 40.000"
            value={displayLiters}
            onChange={(e) => handleFieldChange("liters", e.target.value)}
            readOnly={fieldIsCalculated("liters")}
            step="0.001"
            min="0"
            className={`h-11 ${fieldIsCalculated("liters") ? "bg-amber-50 text-amber-800 cursor-default" : ""}`}
          />
          {errors.liters && (
            <p className="text-red-600 text-xs" role="alert">{errors.liters}</p>
          )}
        </div>

        {/* Price per liter */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="fuelup-ppl">R$ / Litro</Label>
            {fieldIsCalculated("pricePerLiter") && (
              <button
                type="button"
                onClick={() => handleReleaseLock("pricePerLiter")}
                aria-label="Liberar campo preço por litro para edição"
              >
                <Badge className="cursor-pointer bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 transition-colors">
                  calculado
                </Badge>
              </button>
            )}
          </div>
          <Input
            id="fuelup-ppl"
            type="number"
            placeholder="Ex: 5.89"
            value={displayPpl}
            onChange={(e) => handleFieldChange("pricePerLiter", e.target.value)}
            readOnly={fieldIsCalculated("pricePerLiter")}
            step="0.01"
            min="0"
            className={`h-11 ${fieldIsCalculated("pricePerLiter") ? "bg-amber-50 text-amber-800 cursor-default" : ""}`}
          />
          {errors.pricePerLiter && (
            <p className="text-red-600 text-xs" role="alert">{errors.pricePerLiter}</p>
          )}
        </div>

        {/* Total price */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="fuelup-total">Valor Total (R$)</Label>
            {fieldIsCalculated("totalPrice") && (
              <button
                type="button"
                onClick={() => handleReleaseLock("totalPrice")}
                aria-label="Liberar campo total para edição"
              >
                <Badge className="cursor-pointer bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 transition-colors">
                  calculado
                </Badge>
              </button>
            )}
          </div>
          <Input
            id="fuelup-total"
            type="number"
            placeholder="Ex: 235.60"
            value={displayTotal}
            onChange={(e) => handleFieldChange("totalPrice", e.target.value)}
            readOnly={fieldIsCalculated("totalPrice")}
            step="0.01"
            min="0"
            className={`h-11 ${fieldIsCalculated("totalPrice") ? "bg-amber-50 text-amber-800 cursor-default" : ""}`}
          />
          {errors.totalPrice && (
            <p className="text-red-600 text-xs" role="alert">{errors.totalPrice}</p>
          )}
        </div>

        {errors._global && (
          <p className="text-red-600 text-sm" role="alert">{errors._global}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-amber-500 text-white text-[15px] font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 mt-1"
        >
          {loading ? "Salvando…" : submitLabel}
        </Button>
      </form>
    </div>
  );
}

function deriveInitialLocked(
  initialValues: Partial<FuelupFormValues>
): FuelField | null {
  const hasL = initialValues.liters !== undefined;
  const hasPpl = initialValues.pricePerLiter !== undefined;
  const hasT = initialValues.totalPrice !== undefined;
  const count = [hasL, hasPpl, hasT].filter(Boolean).length;
  if (count < 2) return null;
  if (!hasL) return "liters";
  if (!hasPpl) return "pricePerLiter";
  if (!hasT) return "totalPrice";
  // all three present, default to totalPrice as calculated
  return "totalPrice";
}

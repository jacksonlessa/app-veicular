"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { VehicleDTO } from "@/application/dtos/vehicle.dto";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface VehicleFormProps {
  vehicle?: VehicleDTO;
  trigger: React.ReactNode;
  triggerDisabled?: boolean;
}

function XIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function VehicleForm({ vehicle, trigger, triggerDisabled = false }: VehicleFormProps) {
  const router = useRouter();
  const isEditing = Boolean(vehicle);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(vehicle?.name ?? "");
  const [plate, setPlate] = useState(vehicle?.plate ?? "");
  const [odometer, setOdometer] = useState(
    isEditing ? String(vehicle!.currentOdometer) : ""
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setName(vehicle?.name ?? "");
    setPlate(vehicle?.plate ?? "");
    setOdometer(isEditing ? String(vehicle!.currentOdometer) : "");
    setError("");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  function handleTriggerClick() {
    if (!triggerDisabled) {
      setOpen(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Nome é obrigatório.");
      return;
    }
    if (trimmedName.length > 60) {
      setError("Nome deve ter no máximo 60 caracteres.");
      return;
    }

    const odometerValue = parseInt(odometer, 10);
    if (isNaN(odometerValue) || odometerValue < 0) {
      setError("Odômetro deve ser um número inteiro não negativo.");
      return;
    }

    setLoading(true);
    try {
      const url = isEditing
        ? `/api/vehicles/${vehicle!.id}`
        : "/api/vehicles";
      const method = isEditing ? "PUT" : "POST";

      const body = isEditing
        ? {
            name: trimmedName,
            plate: plate.trim() || null,
            currentOdometer: odometerValue,
          }
        : {
            name: trimmedName,
            plate: plate.trim() || undefined,
            initOdometer: odometerValue,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409 || data?.error === "vehicle.limit_reached") {
          setError("Limite de 2 veículos por conta atingido.");
        } else if (res.status === 400 && data?.error === "validation") {
          setError("Verifique os dados informados.");
        } else {
          setError("Erro ao salvar veículo. Tente novamente.");
        }
        return;
      }

      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Wrapper to intercept click and manage open state */}
      <span onClick={handleTriggerClick} className="contents">
        {trigger}
      </span>

      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Popup className="fixed inset-0 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
            <div className="w-full max-w-[430px] bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E2DA]">
                <h2 className="text-[17px] font-bold text-[#1A1814]">
                  {isEditing ? "Editar veículo" : "Adicionar veículo"}
                </h2>
                <Dialog.Close
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B6760] hover:bg-[#F8F7F3] transition-colors"
                  aria-label="Fechar"
                >
                  <XIcon />
                </Dialog.Close>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`vehicle-name-${vehicle?.id ?? "new"}`}>
                    Nome do veículo
                  </Label>
                  <Input
                    id={`vehicle-name-${vehicle?.id ?? "new"}`}
                    type="text"
                    placeholder="Ex: Gol Branco"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                    required
                    autoFocus
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`vehicle-plate-${vehicle?.id ?? "new"}`}>
                    Placa{" "}
                    <span className="text-[#A8A39C] font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id={`vehicle-plate-${vehicle?.id ?? "new"}`}
                    type="text"
                    placeholder="Ex: ABC-1234"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`vehicle-odometer-${vehicle?.id ?? "new"}`}>
                    {isEditing ? "Odômetro atual (km)" : "Odômetro inicial (km)"}
                  </Label>
                  <Input
                    id={`vehicle-odometer-${vehicle?.id ?? "new"}`}
                    type="number"
                    placeholder="Ex: 50000"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    min={0}
                    step={1}
                    required
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm" role="alert">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <Dialog.Close className="flex-1 h-11 rounded-xl border border-[#E5E2DA] text-[#6B6760] text-[15px] font-semibold hover:bg-[#F8F7F3] transition-colors">
                    Cancelar
                  </Dialog.Close>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-11 rounded-xl bg-amber-600 text-white text-[15px] font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Salvando…" : isEditing ? "Salvar" : "Adicionar"}
                  </Button>
                </div>
              </form>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

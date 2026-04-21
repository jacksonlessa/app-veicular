"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FuelupForm } from "@/components/fuelups/FuelupForm";
import { FuelupFormValues } from "@/components/fuelups/fuelup-form.schema";

interface FuelupData {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  fuelType: string;
  fullTank: boolean;
  liters: number;
  pricePerLiter: number;
  totalPrice: number;
  kmPerLiter: number | null;
}

export default function AbastecimentoEditarPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [fuelup, setFuelup] = useState<FuelupData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/fuelups/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Erro ao carregar abastecimento.");
        }
        return res.json() as Promise<FuelupData>;
      })
      .then(setFuelup)
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "Erro ao carregar abastecimento.");
      });
  }, [id]);

  async function onSubmit(values: FuelupFormValues) {
    setSubmitError(null);
    const res = await fetch(`/api/fuelups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setSubmitError(body.error ?? "Erro ao salvar abastecimento.");
      return;
    }
    router.push(`/veiculos/${fuelup?.vehicleId}?tab=abastecimentos`);
  }

  async function handleDelete() {
    if (!confirm("Excluir este abastecimento? Essa ação não pode ser desfeita.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/fuelups/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError(body.error ?? "Erro ao excluir abastecimento.");
        return;
      }
      router.push(`/veiculos/${fuelup?.vehicleId}?tab=abastecimentos`);
    } finally {
      setDeleting(false);
    }
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#F0EEE8] flex items-center justify-center px-4">
        <div
          role="alert"
          className="w-full max-w-[430px] px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          {loadError}
        </div>
      </div>
    );
  }

  if (!fuelup) {
    return (
      <div className="min-h-screen bg-[#F0EEE8] flex items-center justify-center">
        <p className="text-[#6B6760] text-sm">Carregando…</p>
      </div>
    );
  }

  const initialValues: Partial<FuelupFormValues> = {
    vehicleId: fuelup.vehicleId,
    date: fuelup.date.slice(0, 10),
    odometer: fuelup.odometer,
    fuelType: fuelup.fuelType,
    fullTank: fuelup.fullTank,
    liters: fuelup.liters,
    pricePerLiter: fuelup.pricePerLiter,
    totalPrice: fuelup.totalPrice,
  };

  return (
    <div className="min-h-screen bg-[#F0EEE8] flex flex-col items-start justify-start px-4 py-8">
      {submitError && (
        <div
          role="alert"
          className="w-full max-w-[430px] mx-auto mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          {submitError}
        </div>
      )}
      <FuelupForm
        vehicles={[]}
        initialValues={initialValues}
        hiddenVehicleId={fuelup.vehicleId}
        onSubmit={onSubmit}
        submitLabel="Salvar alterações"
      />
      <div className="w-full max-w-[430px] mx-auto mt-4">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="w-full h-11 rounded-xl border border-red-300 bg-red-50 text-red-600 text-[14px] font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {deleting ? "Excluindo…" : "Excluir abastecimento"}
        </button>
      </div>
    </div>
  );
}

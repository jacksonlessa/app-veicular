"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FuelupForm } from "@/components/fuelups/FuelupForm";
import { FuelupFormValues } from "@/components/fuelups/fuelup-form.schema";

function AbastecimentoNovoContent() {
  const params = useSearchParams();
  const vehicleId = params.get("vehicleId") ?? "";
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(values: FuelupFormValues) {
    setError(null);
    const res = await fetch("/api/fuelups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, vehicleId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Erro ao salvar abastecimento.");
      return;
    }
    router.push(`/veiculos/${vehicleId}?tab=abastecimentos`);
  }

  return (
    <div className="min-h-screen bg-[#F0EEE8] flex flex-col items-start justify-start px-4 py-8">
      {error && (
        <div
          role="alert"
          className="w-full max-w-[430px] mx-auto mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          {error}
        </div>
      )}
      <FuelupForm
        vehicles={[]}
        onSubmit={onSubmit}
        submitLabel="Salvar abastecimento"
        hiddenVehicleId={vehicleId}
      />
    </div>
  );
}

export default function AbastecimentoNovoPage() {
  return (
    <Suspense>
      <AbastecimentoNovoContent />
    </Suspense>
  );
}

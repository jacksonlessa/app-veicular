"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MaintenanceForm, MaintenanceFormDefaultValues } from "@/components/maintenances/MaintenanceForm";
import { VehicleDTO } from "@/application/dtos/vehicle.dto";
import { MaintenanceDTO } from "@/application/dtos/maintenance.dto";

function toFormValues(dto: MaintenanceDTO): MaintenanceFormDefaultValues {
  return {
    vehicleId: dto.vehicleId,
    date: dto.date.slice(0, 10),
    odometer: dto.odometer ?? undefined,
    description: dto.description ?? undefined,
    items: dto.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };
}

export default function EditarManutencaoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<MaintenanceDTO | null>(null);
  const [vehicles, setVehicles] = useState<VehicleDTO[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((v: VehicleDTO[]) => setVehicles(v))
      .catch(() => setVehicles([]));
  }, []);

  useEffect(() => {
    fetch(`/api/maintenances/${id}`)
      .then(async (res) => {
        if (res.status === 404) {
          router.replace("/dashboard");
          return null;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Erro ao carregar manutenção (${res.status})`);
        }
        return res.json() as Promise<MaintenanceDTO>;
      })
      .then((dto) => {
        if (dto) setData(dto);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "Erro ao carregar manutenção.");
      });
  }, [id, router]);

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

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F0EEE8] flex items-center justify-center">
        <p className="text-[#6B6760] text-sm">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EEE8] flex flex-col items-start justify-start px-4 py-8">
      <MaintenanceForm
        vehicles={vehicles}
        defaultValues={toFormValues(data)}
        maintenanceId={id}
      />
    </div>
  );
}

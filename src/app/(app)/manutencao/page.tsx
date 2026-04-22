"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MaintenanceForm } from "@/components/maintenances/MaintenanceForm";
import { VehicleDTO } from "@/application/dtos/vehicle.dto";

function NovaManutencaoContent() {
  const params = useSearchParams();
  const vehicleId = params.get("vehicleId") ?? "";

  const [vehicles, setVehicles] = useState<VehicleDTO[]>([]);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((data: VehicleDTO[]) => setVehicles(data))
      .catch(() => setVehicles([]));
  }, []);

  return (
    <div className="min-h-screen bg-[#F0EEE8] flex flex-col items-start justify-start px-4 py-8">
      <MaintenanceForm
        vehicles={vehicles}
        defaultValues={{
          vehicleId: vehicleId,
          items: [{ description: "", quantity: 1, unitPrice: 0 }],
        }}
      />
    </div>
  );
}

export default function NovaManutencaoPage() {
  return (
    <Suspense>
      <NovaManutencaoContent />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { VehicleDTO } from "@/application/dtos/vehicle.dto";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FuelupHistoryList } from "@/components/fuelups/FuelupHistoryList";

function FuelIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 22V6a2 2 0 012-2h8a2 2 0 012 2v16" />
      <path d="M3 22h12" />
      <path d="M15 8h2a2 2 0 012 2v3a1 1 0 001 1h0a1 1 0 001-1V9l-3-3" />
      <path d="M7 10h4" />
    </svg>
  );
}

interface Props {
  vehicle: VehicleDTO;
  defaultTab?: string;
}

export function VehicleDetailView({ vehicle, defaultTab = "abastecimentos" }: Props) {
  return (
    <div className="min-h-screen bg-[#F0EEE8]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E2DA] px-5 py-4 sticky top-0 z-10 flex items-center gap-3">
        <Link href="/dashboard" className="text-amber-600 font-semibold text-[14px]">
          ← Voltar
        </Link>
        <h1 className="text-[18px] font-bold text-[#1A1814] tracking-tight flex-1 truncate">
          {vehicle.name}
        </h1>
        <Link
          href={`/abastecimento?vehicleId=${vehicle.id}`}
          className="flex items-center gap-1.5 bg-amber-600 text-white text-[13px] font-semibold px-3 py-2 rounded-xl hover:bg-amber-700 transition-colors flex-shrink-0"
        >
          <FuelIcon size={14} />
          Abastecer
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-[430px] mx-auto px-5 py-5 pb-24">
        {/* Vehicle info */}
        <div className="bg-white rounded-2xl border border-[#E5E2DA] p-4 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F8F7F3] rounded-xl p-3">
              <p className="text-[11px] font-semibold text-[#A8A39C] uppercase tracking-wider mb-1">Placa</p>
              <p className="text-[14px] font-bold text-[#1A1814]">{vehicle.plate ?? "—"}</p>
            </div>
            <div className="bg-[#F8F7F3] rounded-xl p-3">
              <p className="text-[11px] font-semibold text-[#A8A39C] uppercase tracking-wider mb-1">Odômetro atual</p>
              <p className="text-[14px] font-bold text-[#1A1814]">
                {vehicle.currentOdometer.toLocaleString("pt-BR")} km
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full">
            <TabsTrigger value="abastecimentos" className="flex-1">
              Abastecimentos
            </TabsTrigger>
            <TabsTrigger value="manutencao" disabled className="flex-1">
              Manutenção
            </TabsTrigger>
          </TabsList>
          <TabsContent value="abastecimentos">
            <FuelupHistoryList vehicleId={vehicle.id} />
          </TabsContent>
          <TabsContent value="manutencao">
            <div className="py-10 text-center">
              <p className="text-[14px] font-semibold text-[#6B6760]">Em breve (Fase 5)</p>
              <p className="text-[13px] text-[#A8A39C] mt-1">
                O módulo de manutenção será disponibilizado em breve.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

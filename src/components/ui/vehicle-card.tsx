"use client";

import Link from "next/link";
import { VehicleDTO } from "@/application/dtos/vehicle.dto";

interface VehicleCardProps {
  vehicle: VehicleDTO;
  lastKmPerLiter?: number | null;
}

function CarIcon() {
  return (
    <svg
      width={26}
      height={26}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 17H3v-4l2-5h14l2 5v4h-2" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
      <path d="M5 13h14" />
    </svg>
  );
}

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

function WrenchIcon({ size = 16 }: { size?: number }) {
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
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function RoadIcon({ size = 14 }: { size?: number }) {
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
      <path d="M4 21l4-18h8l4 18" />
      <path d="M9.5 11h5" />
      <path d="M8 17h8" />
    </svg>
  );
}

export function VehicleCard({ vehicle, lastKmPerLiter }: VehicleCardProps) {
  const formattedOdometer = vehicle.currentOdometer.toLocaleString("pt-BR");
  const plate = vehicle.plate ?? "—";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E2DA] p-5 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
            <CarIcon />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-[#1A1814] tracking-tight leading-tight">
              {vehicle.name}
            </h2>
            <p className="text-[13px] text-[#6B6760]">{plate}</p>
          </div>
        </div>
        <Link
          href={`/veiculos/${vehicle.id}`}
          className="text-[12px] font-semibold text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors flex-shrink-0"
        >
          Histórico
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#F8F7F3] rounded-xl p-3">
          <p className="text-[11px] font-semibold text-[#A8A39C] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <RoadIcon size={12} />
            Odômetro
          </p>
          <p className="text-[14px] font-bold text-[#1A1814] leading-tight">
            {formattedOdometer} km
          </p>
        </div>
        <div className="bg-[#F8F7F3] rounded-xl p-3">
          <p className="text-[11px] font-semibold text-[#A8A39C] uppercase tracking-wider mb-1">
            Eficiência
          </p>
          <p className="text-[14px] font-bold text-[#1A1814] leading-tight">
            {lastKmPerLiter != null
              ? lastKmPerLiter.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " km/l"
              : "—"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5">
        <Link
          href={`/abastecimento?vehicleId=${vehicle.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-amber-600 text-white text-[14px] font-semibold hover:bg-amber-700 transition-colors"
        >
          <FuelIcon size={15} />
          Abastecer
        </Link>
        <button
          disabled
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-amber-600 text-amber-600 text-[14px] font-semibold opacity-50 cursor-not-allowed"
        >
          <WrenchIcon size={15} />
          Manutenção
        </button>
      </div>
    </div>
  );
}

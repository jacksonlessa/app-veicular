"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface FuelupItem {
  id: string;
  date: string;
  odometer: number;
  fuelType: string;
  fullTank: boolean;
  liters: number;
  pricePerLiter: number;
  totalPrice: number;
  kmPerLiter: number | null;
}

interface Props {
  vehicleId: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function FuelupHistoryList({ vehicleId }: Props) {
  const [items, setItems] = useState<FuelupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/fuelups?vehicleId=${vehicleId}&pageSize=100`)
      .then((r) => {
        if (!r.ok) throw new Error("Erro ao carregar abastecimentos");
        return r.json();
      })
      .then((data: { items: FuelupItem[] }) => {
        // Sort descending (most recent first)
        const sorted = [...data.items].sort((a, b) => {
          const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (diff !== 0) return diff;
          return b.odometer - a.odometer;
        });
        setItems(sorted);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Erro desconhecido"))
      .finally(() => setLoading(false));
  }, [vehicleId]);

  if (loading) {
    return (
      <div className="py-10 text-center text-[14px] text-[#6B6760]">
        Carregando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center text-[14px] text-red-500">{error}</div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-[14px] text-[#6B6760]">Nenhum abastecimento registrado.</p>
        <p className="text-[13px] text-[#A8A39C] mt-1">
          Use o botão &quot;Abastecer&quot; para adicionar o primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 mt-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/abastecimento/${item.id}`}
          className="bg-white rounded-2xl border border-[#E5E2DA] p-4 flex items-center gap-4 hover:border-amber-300 transition-colors"
        >
          {/* Left: date + fuelType */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#1A1814]">
              {formatDate(item.date)}
            </p>
            <p className="text-[12px] text-[#6B6760] mt-0.5">{item.fuelType}</p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <p className="text-[10px] font-semibold text-[#A8A39C] uppercase tracking-wider">Odômetro</p>
                <p className="text-[12px] font-semibold text-[#1A1814]">
                  {item.odometer.toLocaleString("pt-BR")} km
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#A8A39C] uppercase tracking-wider">Litros</p>
                <p className="text-[12px] font-semibold text-[#1A1814]">
                  {formatNumber(item.liters, 2)} L
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#A8A39C] uppercase tracking-wider">Total</p>
                <p className="text-[12px] font-semibold text-[#1A1814]">
                  R$ {formatNumber(item.totalPrice, 2)}
                </p>
              </div>
            </div>
          </div>
          {/* Right: km/l */}
          <div className="flex-shrink-0 text-right">
            {item.kmPerLiter != null ? (
              <div className="bg-amber-50 rounded-xl px-3 py-2 text-center">
                <p className="text-[18px] font-bold text-amber-600 leading-tight">
                  {formatNumber(item.kmPerLiter, 1)}
                </p>
                <p className="text-[10px] font-semibold text-amber-500">km/l</p>
              </div>
            ) : (
              <div className="bg-[#F8F7F3] rounded-xl px-3 py-2 text-center">
                <p className="text-[18px] font-bold text-[#C9C4BC] leading-tight">—</p>
                <p className="text-[10px] font-semibold text-[#A8A39C]">km/l</p>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MaintenanceDTO } from "@/application/dtos/maintenance.dto";

interface Props {
  vehicleId: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCurrency(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function MaintenanceAccordionItem({
  maintenance,
  onDelete,
}: {
  maintenance: MaintenanceDTO;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/maintenances/${maintenance.id}`, { method: "DELETE" });
      onDelete(maintenance.id);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E2DA] overflow-hidden">
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F8F7F3] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#1A1814]">
            {formatDate(maintenance.date)}
          </p>
          {maintenance.description && (
            <p className="text-[12px] text-[#6B6760] mt-0.5 truncate">
              {maintenance.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <span className="text-[13px] font-semibold text-amber-600">
            {formatCurrency(maintenance.totalPrice)}
          </span>
          <span className="text-[#A8A39C]">
            <ChevronIcon open={open} />
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-4 pb-4 border-t border-[#E5E2DA]">
          {/* Items grid */}
          <div className="mt-3">
            {/* Header row */}
            <div className="grid grid-cols-5 gap-2 mb-2">
              <p className="text-[10px] font-semibold text-[#A8A39C] uppercase tracking-wider col-span-2">
                Descrição
              </p>
              <p className="text-[10px] font-semibold text-[#A8A39C] uppercase tracking-wider text-right">
                Qtd
              </p>
              <p className="text-[10px] font-semibold text-[#A8A39C] uppercase tracking-wider text-right">
                Unit
              </p>
              <p className="text-[10px] font-semibold text-[#A8A39C] uppercase tracking-wider text-right">
                Subtotal
              </p>
            </div>
            {/* Item rows */}
            {maintenance.items.map((item) => (
              <div key={item.id} className="grid grid-cols-5 gap-2 py-1.5 border-t border-[#F0EEE8] first:border-t-0">
                <p className="text-[12px] text-[#1A1814] col-span-2 truncate">{item.description}</p>
                <p className="text-[12px] text-[#6B6760] text-right">{item.quantity}</p>
                <p className="text-[12px] text-[#6B6760] text-right">
                  {formatCurrency(item.unitPrice)}
                </p>
                <p className="text-[12px] font-semibold text-[#1A1814] text-right">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
            ))}
            {/* Total row */}
            <div className="grid grid-cols-5 gap-2 pt-2 mt-1 border-t border-[#E5E2DA]">
              <p className="text-[12px] font-semibold text-[#1A1814] col-span-4">Total</p>
              <p className="text-[12px] font-bold text-amber-600 text-right">
                {formatCurrency(maintenance.totalPrice)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 gap-2">
            <Link
              href={`/manutencao/${maintenance.id}`}
              className="text-[13px] font-semibold text-amber-600 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              Editar
            </Link>

            {confirming ? (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[#6B6760]">Confirmar exclusão?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-[12px] font-semibold text-white bg-red-500 px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? "..." : "Sim"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="text-[12px] font-semibold text-[#6B6760] px-3 py-1.5 rounded-lg border border-[#E5E2DA] hover:bg-[#F8F7F3] transition-colors"
                >
                  Não
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="text-[13px] font-semibold text-red-500 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function MaintenanceHistoryList({ vehicleId }: Props) {
  const [maintenances, setMaintenances] = useState<MaintenanceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/maintenances?vehicleId=${vehicleId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Erro ao carregar manutenções");
        return r.json();
      })
      .then((data: MaintenanceDTO[]) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setMaintenances(sorted);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Erro desconhecido"))
      .finally(() => setLoading(false));
  }, [vehicleId]);

  const handleDelete = (id: string) => {
    setMaintenances((prev) => prev.filter((m) => m.id !== id));
  };

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

  if (maintenances.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-[14px] text-[#6B6760]">Nenhuma manutenção registrada.</p>
        <p className="text-[13px] text-[#A8A39C] mt-1">
          Use o botão &quot;Manutenção&quot; para registrar a primeira.
        </p>
        <Link
          href={`/manutencao?vehicleId=${vehicleId}`}
          className="inline-block mt-4 text-[13px] font-semibold text-white bg-amber-600 px-4 py-2 rounded-xl hover:bg-amber-700 transition-colors"
        >
          Registrar manutenção
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 mt-4">
      {maintenances.map((m) => (
        <MaintenanceAccordionItem key={m.id} maintenance={m} onDelete={handleDelete} />
      ))}
    </div>
  );
}

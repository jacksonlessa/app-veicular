"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertDialog } from "@base-ui/react/alert-dialog";

interface DeleteDialogProps {
  vehicleId: string;
  vehicleName: string;
  trigger: React.ReactNode;
}

export function DeleteDialog({ vehicleId, vehicleName, trigger }: DeleteDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("Erro ao remover veículo. Tente novamente.");
        return;
      }
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger render={trigger as React.ReactElement} />

      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 bg-black/40 z-40" />
        <AlertDialog.Popup className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-[380px] bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-4">
            <div>
              <AlertDialog.Title className="text-[17px] font-bold text-[#1A1814] mb-2">
                Remover veículo
              </AlertDialog.Title>
              <AlertDialog.Description className="text-[14px] text-[#6B6760] leading-relaxed">
                Tem certeza que deseja remover{" "}
                <strong className="text-[#1A1814]">{vehicleName}</strong>? Esta
                ação não pode ser desfeita.
              </AlertDialog.Description>
            </div>

            {error && (
              <p className="text-red-600 text-sm" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <AlertDialog.Close className="flex-1 h-11 rounded-xl border border-[#E5E2DA] text-[#6B6760] text-[15px] font-semibold hover:bg-[#F8F7F3] transition-colors">
                Cancelar
              </AlertDialog.Close>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-red-600 text-white text-[15px] font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Removendo…" : "Remover"}
              </button>
            </div>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

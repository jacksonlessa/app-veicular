import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/infrastructure/auth/nextauth.config";
import { listVehiclesUseCase } from "@/infrastructure/container";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { DeleteDialog } from "@/components/vehicles/delete-dialog";

function CarIcon({ size = 24 }: { size?: number }) {
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
      <path d="M5 17H3v-4l2-5h14l2 5v4h-2" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
      <path d="M5 13h14" />
    </svg>
  );
}

function PlusIcon() {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { vehicles } = await listVehiclesUseCase.execute({
    accountId: session.accountId,
  });

  const canAddVehicle = vehicles.length < 2;

  return (
    <div className="min-h-screen bg-[#F0EEE8]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E2DA] px-5 py-4 sticky top-0 z-10">
        <h1 className="text-[18px] font-bold text-[#1A1814] tracking-tight">
          Meus Veículos
        </h1>
      </div>

      {/* Content */}
      <div className="max-w-[430px] mx-auto px-5 py-5 pb-24">
        {/* Add vehicle button */}
        <VehicleForm
          triggerDisabled={!canAddVehicle}
          trigger={
            <button
              disabled={!canAddVehicle}
              className="w-full flex items-center justify-center gap-2 py-3.5 mb-5 rounded-xl border-2 border-dashed border-[#E5E2DA] text-[#6B6760] text-[14px] font-semibold hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#E5E2DA] disabled:hover:text-[#6B6760] disabled:hover:bg-transparent"
            >
              <PlusIcon />
              {canAddVehicle ? "Adicionar veículo" : "Limite de 2 veículos atingido"}
            </button>
          }
        />

        {/* Vehicle list */}
        {vehicles.length === 0 ? (
          <div className="text-center py-10 text-[14px] text-[#A8A39C]">
            Nenhum veículo cadastrado ainda.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-2xl shadow-sm border border-[#E5E2DA] p-5"
              >
                {/* Vehicle header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                    <CarIcon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[16px] font-bold text-[#1A1814] tracking-tight leading-tight truncate">
                      {vehicle.name}
                    </h2>
                    <p className="text-[13px] text-[#6B6760] mt-0.5">
                      {vehicle.plate ?? "Sem placa"} &bull;{" "}
                      {vehicle.currentOdometer.toLocaleString("pt-BR")} km
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2.5">
                  <VehicleForm
                    vehicle={vehicle}
                    trigger={
                      <button className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border border-[#E5E2DA] text-[#1A1814] text-[13px] font-semibold hover:bg-[#F8F7F3] transition-colors">
                        <EditIcon />
                        Editar
                      </button>
                    }
                  />

                  <DeleteDialog
                    vehicleId={vehicle.id}
                    vehicleName={vehicle.name}
                    trigger={
                      <button className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border border-red-200 text-red-600 text-[13px] font-semibold hover:bg-red-50 transition-colors">
                        <TrashIcon />
                        Excluir
                      </button>
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/infrastructure/auth/nextauth.config";
import { listVehiclesUseCase, fuelupRepository } from "@/infrastructure/container";
import { VehicleCard } from "@/components/ui/vehicle-card";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { vehicles } = await listVehiclesUseCase.execute({
    accountId: session.accountId,
  });

  // Fetch last kmPerLiter per vehicle — single focused query per vehicle
  const kmPerLiterMap = Object.fromEntries(
    await Promise.all(
      vehicles.map(async (v) => [
        v.id,
        await fuelupRepository.findLastKmlByVehicle(v.id),
      ])
    )
  );

  if (vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-[#F0EEE8] flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-[430px] bg-white rounded-2xl shadow-sm border border-[#E5E2DA] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
            <svg
              width={32}
              height={32}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-600"
            >
              <path d="M5 17H3v-4l2-5h14l2 5v4h-2" />
              <circle cx="7.5" cy="17.5" r="1.5" />
              <circle cx="16.5" cy="17.5" r="1.5" />
              <path d="M5 13h14" />
            </svg>
          </div>
          <h2 className="text-[20px] font-bold text-[#1A1814] tracking-tight mb-2">
            Nenhum veículo cadastrado
          </h2>
          <p className="text-[14px] text-[#6B6760] mb-6 leading-relaxed">
            Cadastre seu primeiro veículo para começar a registrar gastos
          </p>
          <Link
            href="/configuracoes"
            className="inline-flex items-center justify-center w-full px-5 py-3.5 rounded-xl bg-amber-600 text-white text-[15px] font-semibold hover:bg-amber-700 transition-colors"
          >
            Adicionar veículo
          </Link>
        </div>
      </div>
    );
  }

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
        <p className="text-[15px] text-[#6B6760] mb-5">
          Olá,{" "}
          <strong className="text-[#1A1814]">
            {session.user?.name?.split(" ")[0] ?? "usuário"}
          </strong>
          ! Seus veículos:
        </p>
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} lastKmPerLiter={kmPerLiterMap[vehicle.id]} />
        ))}
      </div>
    </div>
  );
}

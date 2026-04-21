import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/infrastructure/auth/nextauth.config";
import { listVehiclesUseCase } from "@/infrastructure/container";
import { VehicleDetailView } from "@/components/vehicles/VehicleDetailView";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function VehicleDetailPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const { tab } = await searchParams;

  const { vehicles } = await listVehiclesUseCase.execute({ accountId: session.accountId });
  const vehicle = vehicles.find((v) => v.id === id);

  if (!vehicle) {
    notFound();
  }

  return <VehicleDetailView vehicle={vehicle} defaultTab={tab ?? "abastecimentos"} />;
}

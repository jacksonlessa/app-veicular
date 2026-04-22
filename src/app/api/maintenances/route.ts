import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/nextauth.config";
import { listMaintenancesUseCase, registerMaintenanceUseCase } from "@/infrastructure/container";
import { mapDomainError } from "@/app/api/_lib/error-handler";
import { CreateMaintenanceSchema } from "./schema";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const url = new URL(req.url);
  const vehicleId = url.searchParams.get("vehicleId");
  if (!vehicleId) return NextResponse.json({ error: "vehicleId.required" }, { status: 400 });

  try {
    const out = await listMaintenancesUseCase.execute({
      accountId: session.accountId,
      vehicleId,
    });
    return NextResponse.json(out, { status: 200 });
  } catch (e) {
    return mapDomainError(e);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = CreateMaintenanceSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "validation", issues: parsed.error.issues }, { status: 400 });

  try {
    const out = await registerMaintenanceUseCase.execute({
      accountId: session.accountId,
      userId: session.userId,
      vehicleId: parsed.data.vehicleId,
      date: new Date(parsed.data.date),
      odometer: parsed.data.odometer,
      description: parsed.data.description,
      items: parsed.data.items,
    });
    return NextResponse.json(out, { status: 201 });
  } catch (e) {
    return mapDomainError(e);
  }
}

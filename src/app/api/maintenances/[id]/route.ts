import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/nextauth.config";
import {
  getMaintenanceUseCase,
  updateMaintenanceUseCase,
  deleteMaintenanceUseCase,
} from "@/infrastructure/container";
import { mapDomainError } from "@/app/api/_lib/error-handler";
import { UpdateMaintenanceSchema } from "../schema";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    const out = await getMaintenanceUseCase.execute({
      id,
      accountId: session.accountId,
    });
    return NextResponse.json(out, { status: 200 });
  } catch (e) {
    return mapDomainError(e);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = UpdateMaintenanceSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "validation", issues: parsed.error.issues }, { status: 400 });

  try {
    const out = await updateMaintenanceUseCase.execute({
      maintenanceId: id,
      accountId: session.accountId,
      date: new Date(parsed.data.date),
      odometer: parsed.data.odometer,
      description: parsed.data.description,
      items: parsed.data.items,
    });
    return NextResponse.json(out, { status: 200 });
  } catch (e) {
    return mapDomainError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    await deleteMaintenanceUseCase.execute({
      id,
      accountId: session.accountId,
    });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return mapDomainError(e);
  }
}

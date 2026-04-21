import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/nextauth.config";
import { updateVehicleUseCase, deleteVehicleUseCase } from "@/infrastructure/container";
import { mapDomainError } from "@/app/api/_lib/error-handler";
import { z } from "zod";

export const runtime = "nodejs";

const UpdateVehicleSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  plate: z.string().nullable().optional(),
  currentOdometer: z.number().int().nonnegative().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = UpdateVehicleSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "validation", issues: parsed.error.issues }, { status: 400 });

  try {
    const out = await updateVehicleUseCase.execute({
      vehicleId: id,
      accountId: session.accountId,
      ...parsed.data,
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
    await deleteVehicleUseCase.execute({
      vehicleId: id,
      accountId: session.accountId,
    });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return mapDomainError(e);
  }
}

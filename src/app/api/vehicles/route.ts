import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/nextauth.config";
import { listVehiclesUseCase, createVehicleUseCase } from "@/infrastructure/container";
import { mapDomainError } from "@/app/api/_lib/error-handler";
import { z } from "zod";

export const runtime = "nodejs";

const CreateVehicleSchema = z.object({
  name: z.string().min(1).max(60),
  plate: z.string().optional(),
  initOdometer: z.number().int().nonnegative(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    const out = await listVehiclesUseCase.execute({ accountId: session.accountId });
    return NextResponse.json(out, { status: 200 });
  } catch (e) {
    return mapDomainError(e);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = CreateVehicleSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "validation", issues: parsed.error.issues }, { status: 400 });

  try {
    const out = await createVehicleUseCase.execute({
      accountId: session.accountId,
      ...parsed.data,
    });
    return NextResponse.json(out, { status: 201 });
  } catch (e) {
    return mapDomainError(e);
  }
}

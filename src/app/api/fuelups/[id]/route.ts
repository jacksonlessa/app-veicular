import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/nextauth.config";
import { getFuelupUseCase, updateFuelupUseCase, deleteFuelupUseCase } from "@/infrastructure/container";
import { mapDomainError } from "@/app/api/_lib/error-handler";
import { UpdateFuelupSchema } from "../schema";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    const out = await getFuelupUseCase.execute({
      accountId: session.accountId,
      fuelupId: id,
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

  const parsed = UpdateFuelupSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "validation", issues: parsed.error.issues }, { status: 400 });

  try {
    const out = await updateFuelupUseCase.execute({
      accountId: session.accountId,
      fuelupId: id,
      ...parsed.data,
      date: parsed.data.date ? new Date(parsed.data.date) : undefined,
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
    await deleteFuelupUseCase.execute({
      accountId: session.accountId,
      fuelupId: id,
    });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return mapDomainError(e);
  }
}

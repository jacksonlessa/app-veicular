import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/nextauth.config";
import { inviteUserUseCase } from "@/infrastructure/container";
import { mapDomainError } from "@/app/api/_lib/error-handler";
import { z } from "zod";

export const runtime = "nodejs";

const InviteCreateSchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = InviteCreateSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "validation", issues: parsed.error.issues }, { status: 400 });
  try {
    const out = await inviteUserUseCase.execute({
      accountId: session.accountId,
      inviterUserId: session.userId,
      email: parsed.data.email,
    });
    return NextResponse.json(out, { status: 201 });
  } catch (e) {
    return mapDomainError(e);
  }
}

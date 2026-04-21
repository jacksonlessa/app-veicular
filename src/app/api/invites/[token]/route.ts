import { NextResponse } from "next/server";
import { inviteRepository, accountRepository, acceptInviteUseCase } from "@/infrastructure/container";
import { mapDomainError } from "@/app/api/_lib/error-handler";
import { InviteToken } from "@/domain/shared/value-objects/invite-token.vo";
import { z } from "zod";

export const runtime = "nodejs";

const AcceptSchema = z.object({ name: z.string().min(1), password: z.string().min(8) });

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  try {
    const token = InviteToken.create(params.token);
    const invite = await inviteRepository.findByToken(token);
    if (!invite) return NextResponse.json({ error: "invite.not_found" }, { status: 404 });
    if (!invite.isUsable(new Date())) return NextResponse.json({ error: "invite.expired_or_used" }, { status: 410 });
    const account = await accountRepository.findById(invite.accountId);
    return NextResponse.json({ email: invite.email.value, accountName: account!.name });
  } catch (e) {
    return mapDomainError(e);
  }
}

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const parsed = AcceptSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "validation", issues: parsed.error.issues }, { status: 400 });
  try {
    const out = await acceptInviteUseCase.execute({ token: params.token, ...parsed.data });
    return NextResponse.json(out, { status: 201 });
  } catch (e) {
    return mapDomainError(e);
  }
}

import { NextResponse } from "next/server";
import { registerAccountUseCase } from "@/infrastructure/container";
import { mapDomainError } from "@/app/api/_lib/error-handler";
import { RegisterSchema } from "./schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const parsed = RegisterSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "validation", issues: parsed.error.issues },
      { status: 400 },
    );
  try {
    const out = await registerAccountUseCase.execute(parsed.data);
    return NextResponse.json(out, { status: 201 });
  } catch (e) {
    return mapDomainError(e);
  }
}

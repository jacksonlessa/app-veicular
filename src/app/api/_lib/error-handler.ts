import { NextResponse } from "next/server";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";

export function mapDomainError(e: unknown): NextResponse {
  if (e instanceof InvalidValueError)
    return NextResponse.json({ error: "validation", field: e.field }, { status: 400 });
  if (e instanceof BusinessRuleError) {
    if (e.code === "invite.not_found" || e.code === "vehicle.not_found" || e.code === "fuelup.not_found" || e.code === "maintenance.not_found")
      return NextResponse.json({ error: e.code }, { status: 404 });
    if (e.code === "vehicle.not_owned")
      return NextResponse.json({ error: e.code }, { status: 403 });
    if (e.code === "odometer.not_increasing" || e.code === "fuelup.three_fields" || e.code === "fuelup.total_mismatch")
      return NextResponse.json({ error: e.code }, { status: 400 });
    if (e.code === "vehicle.limit_reached")
      return NextResponse.json({ error: e.code }, { status: 409 });
    if (e.code === "invite.expired_or_used")
      return NextResponse.json({ error: e.code }, { status: 410 });
    return NextResponse.json({ error: e.code }, { status: 409 });
  }
  console.error("[api:unhandled]", e);
  return NextResponse.json({ error: "internal" }, { status: 500 });
}

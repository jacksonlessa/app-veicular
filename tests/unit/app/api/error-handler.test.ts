import { describe, it, expect, vi, beforeEach } from "vitest";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";

// ---------------------------------------------------------------------------
// Mock next/server so tests run without Next.js runtime
// ---------------------------------------------------------------------------

vi.mock("next/server", () => {
  return {
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => ({
        body,
        status: init?.status ?? 200,
      }),
    },
  };
});

// Import after mocking
const { mapDomainError } = await import("@/app/api/_lib/error-handler");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function response(e: unknown) {
  return mapDomainError(e) as unknown as { body: unknown; status: number };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("mapDomainError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("InvalidValueError → 400 with validation body", () => {
    const e = new InvalidValueError("email", "bad@");
    const res = response(e);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "validation", field: "email" });
  });

  it("BusinessRuleError invite.not_found → 404", () => {
    const e = new BusinessRuleError("invite.not_found");
    const res = response(e);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "invite.not_found" });
  });

  it("BusinessRuleError invite.expired_or_used → 410", () => {
    const e = new BusinessRuleError("invite.expired_or_used");
    const res = response(e);
    expect(res.status).toBe(410);
    expect(res.body).toEqual({ error: "invite.expired_or_used" });
  });

  it("Other BusinessRuleError → 409", () => {
    const e = new BusinessRuleError("email.duplicate");
    const res = response(e);
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "email.duplicate" });
  });

  it("Unknown error → 500 and calls console.error", () => {
    const e = new Error("unexpected");
    const res = response(e);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "internal" });
    expect(console.error).toHaveBeenCalledWith("[api:unhandled]", e);
  });
});

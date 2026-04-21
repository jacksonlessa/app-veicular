import { describe, expect, it } from "vitest";
import { Invite } from "@/domain/account/entities/invite.entity";
import type { InviteProps, InviteStatus } from "@/domain/account/entities/invite.entity";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { Email } from "@/domain/shared/value-objects/email.vo";
import { InviteToken } from "@/domain/shared/value-objects/invite-token.vo";

const validEmail = Email.create("invited@example.com");
const validToken = InviteToken.create("a".repeat(64));

const baseInput = {
  id: "inv-1",
  accountId: "acc-1",
  email: validEmail,
  token: validToken,
  ttlHours: 48,
};

const fixedNow = new Date("2026-01-01T12:00:00.000Z");

describe("Invite.create", () => {
  it("creates invite with status 'pending'", () => {
    const invite = Invite.create({ ...baseInput, now: fixedNow });
    expect(invite.status).toBe("pending");
  });

  it("sets expiresAt to now + ttlHours", () => {
    const invite = Invite.create({ ...baseInput, ttlHours: 48, now: fixedNow });
    const expectedExpiresAt = new Date(fixedNow.getTime() + 48 * 60 * 60 * 1000);
    expect(invite.expiresAt.getTime()).toBe(expectedExpiresAt.getTime());
  });

  it("sets createdAt to 'now'", () => {
    const invite = Invite.create({ ...baseInput, now: fixedNow });
    expect(invite.createdAt.getTime()).toBe(fixedNow.getTime());
  });

  it("sets all provided props correctly", () => {
    const invite = Invite.create({ ...baseInput, now: fixedNow });
    expect(invite.id).toBe("inv-1");
    expect(invite.accountId).toBe("acc-1");
    expect(invite.email).toBe(validEmail);
    expect(invite.token).toBe(validToken);
  });

  it("uses current date when 'now' is not provided", () => {
    const before = Date.now();
    const invite = Invite.create(baseInput);
    const after = Date.now();
    expect(invite.createdAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(invite.createdAt.getTime()).toBeLessThanOrEqual(after);
  });

  it("calculates expiresAt correctly for 24h TTL", () => {
    const invite = Invite.create({ ...baseInput, ttlHours: 24, now: fixedNow });
    const expectedExpiresAt = new Date(fixedNow.getTime() + 24 * 60 * 60 * 1000);
    expect(invite.expiresAt.getTime()).toBe(expectedExpiresAt.getTime());
  });
});

describe("Invite.rehydrate", () => {
  it("rehydrates all props without validation", () => {
    const expiresAt = new Date("2026-01-03T12:00:00.000Z");
    const createdAt = new Date("2026-01-01T12:00:00.000Z");
    const props: InviteProps = {
      id: "inv-2",
      accountId: "acc-2",
      email: validEmail,
      token: validToken,
      status: "accepted",
      expiresAt,
      createdAt,
    };
    const invite = Invite.rehydrate(props);
    expect(invite.id).toBe("inv-2");
    expect(invite.accountId).toBe("acc-2");
    expect(invite.email).toBe(validEmail);
    expect(invite.token).toBe(validToken);
    expect(invite.status).toBe("accepted");
    expect(invite.expiresAt).toBe(expiresAt);
    expect(invite.createdAt).toBe(createdAt);
  });

  it("rehydrates with 'expired' status", () => {
    const invite = Invite.rehydrate({
      id: "inv-3",
      accountId: "acc-3",
      email: validEmail,
      token: validToken,
      status: "expired",
      expiresAt: new Date("2025-01-01T00:00:00.000Z"),
      createdAt: new Date("2024-12-30T00:00:00.000Z"),
    });
    expect(invite.status).toBe("expired");
  });
});

describe("Invite.isExpired", () => {
  it("returns false when now is before expiresAt", () => {
    const invite = Invite.create({ ...baseInput, now: fixedNow, ttlHours: 48 });
    const before = new Date(invite.expiresAt.getTime() - 1);
    expect(invite.isExpired(before)).toBe(false);
  });

  it("returns true when now equals expiresAt", () => {
    const invite = Invite.create({ ...baseInput, now: fixedNow, ttlHours: 48 });
    expect(invite.isExpired(invite.expiresAt)).toBe(true);
  });

  it("returns true when now is after expiresAt", () => {
    const invite = Invite.create({ ...baseInput, now: fixedNow, ttlHours: 48 });
    const after = new Date(invite.expiresAt.getTime() + 1);
    expect(invite.isExpired(after)).toBe(true);
  });

  it("returns false just before expiry boundary", () => {
    const invite = Invite.create({ ...baseInput, now: fixedNow, ttlHours: 1 });
    const justBefore = new Date(invite.expiresAt.getTime() - 1000);
    expect(invite.isExpired(justBefore)).toBe(false);
  });
});

describe("Invite.isUsable", () => {
  it("returns true for a fresh pending invite", () => {
    const invite = Invite.create({ ...baseInput, now: fixedNow, ttlHours: 48 });
    const checkTime = new Date(fixedNow.getTime() + 1000);
    expect(invite.isUsable(checkTime)).toBe(true);
  });

  it("returns false when invite is expired (now >= expiresAt)", () => {
    const invite = Invite.create({ ...baseInput, now: fixedNow, ttlHours: 48 });
    const afterExpiry = new Date(invite.expiresAt.getTime() + 1);
    expect(invite.isUsable(afterExpiry)).toBe(false);
  });

  it("returns false when invite is at expiry boundary", () => {
    const invite = Invite.create({ ...baseInput, now: fixedNow, ttlHours: 48 });
    expect(invite.isUsable(invite.expiresAt)).toBe(false);
  });

  it("returns false for an accepted invite (even if not expired)", () => {
    const expiresAt = new Date(fixedNow.getTime() + 48 * 60 * 60 * 1000);
    const invite = Invite.rehydrate({
      id: "inv-acc",
      accountId: "acc-1",
      email: validEmail,
      token: validToken,
      status: "accepted",
      expiresAt,
      createdAt: fixedNow,
    });
    const checkTime = new Date(fixedNow.getTime() + 1000);
    expect(invite.isUsable(checkTime)).toBe(false);
  });

  it("returns false for an 'expired' status invite (even if expiresAt is in the future)", () => {
    const expiresAt = new Date(fixedNow.getTime() + 48 * 60 * 60 * 1000);
    const invite = Invite.rehydrate({
      id: "inv-exp",
      accountId: "acc-1",
      email: validEmail,
      token: validToken,
      status: "expired",
      expiresAt,
      createdAt: fixedNow,
    });
    const checkTime = new Date(fixedNow.getTime() + 1000);
    expect(invite.isUsable(checkTime)).toBe(false);
  });
});

describe("Invite.markAccepted", () => {
  it("changes status to 'accepted' for a pending, non-expired invite", () => {
    // Create invite with a far-future expiresAt so it won't be expired when markAccepted is called
    const farFuture = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const invite = Invite.rehydrate({
      id: "inv-m",
      accountId: "acc-1",
      email: validEmail,
      token: validToken,
      status: "pending",
      expiresAt: farFuture,
      createdAt: new Date(),
    });
    invite.markAccepted();
    expect(invite.status).toBe("accepted");
  });

  it("makes invite not usable after markAccepted", () => {
    const farFuture = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const invite = Invite.rehydrate({
      id: "inv-m2",
      accountId: "acc-1",
      email: validEmail,
      token: validToken,
      status: "pending",
      expiresAt: farFuture,
      createdAt: new Date(),
    });
    invite.markAccepted();
    expect(invite.isUsable(new Date())).toBe(false);
  });

  it("throws BusinessRuleError if invite is already accepted", () => {
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const invite = Invite.rehydrate({
      id: "inv-aa",
      accountId: "acc-1",
      email: validEmail,
      token: validToken,
      status: "accepted",
      expiresAt,
      createdAt: new Date(),
    });
    expect(() => invite.markAccepted()).toThrow(BusinessRuleError);
  });

  it("throws BusinessRuleError with code 'invite.expired_or_used' when already accepted", () => {
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const invite = Invite.rehydrate({
      id: "inv-code",
      accountId: "acc-1",
      email: validEmail,
      token: validToken,
      status: "accepted",
      expiresAt,
      createdAt: new Date(),
    });
    let err: BusinessRuleError | undefined;
    try {
      invite.markAccepted();
    } catch (e) {
      err = e as BusinessRuleError;
    }
    expect(err?.code).toBe("invite.expired_or_used");
  });

  it("throws BusinessRuleError when invite is expired (past expiresAt)", () => {
    const pastDate = new Date(Date.now() - 1000);
    const invite = Invite.rehydrate({
      id: "inv-exp2",
      accountId: "acc-1",
      email: validEmail,
      token: validToken,
      status: "pending",
      expiresAt: pastDate,
      createdAt: new Date(Date.now() - 2000),
    });
    expect(() => invite.markAccepted()).toThrow(BusinessRuleError);
  });

  it("throws BusinessRuleError with code 'invite.expired_or_used' when expired", () => {
    const pastDate = new Date(Date.now() - 1000);
    const invite = Invite.rehydrate({
      id: "inv-exp3",
      accountId: "acc-1",
      email: validEmail,
      token: validToken,
      status: "pending",
      expiresAt: pastDate,
      createdAt: new Date(Date.now() - 2000),
    });
    let err: BusinessRuleError | undefined;
    try {
      invite.markAccepted();
    } catch (e) {
      err = e as BusinessRuleError;
    }
    expect(err?.code).toBe("invite.expired_or_used");
  });

  it("throws BusinessRuleError when invite status is 'expired'", () => {
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const invite = Invite.rehydrate({
      id: "inv-exp4",
      accountId: "acc-1",
      email: validEmail,
      token: validToken,
      status: "expired",
      expiresAt,
      createdAt: new Date(),
    });
    expect(() => invite.markAccepted()).toThrow(BusinessRuleError);
  });

  it("throws on second markAccepted call", () => {
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const invite = Invite.rehydrate({
      id: "inv-double",
      accountId: "acc-1",
      email: validEmail,
      token: validToken,
      status: "pending",
      expiresAt,
      createdAt: new Date(),
    });
    invite.markAccepted();
    expect(() => invite.markAccepted()).toThrow(BusinessRuleError);
  });
});

describe("InviteStatus type coverage", () => {
  it("covers all valid status values", () => {
    const statuses: InviteStatus[] = ["pending", "accepted", "expired"];
    expect(statuses).toHaveLength(3);
  });
});

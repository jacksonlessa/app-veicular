import { describe, it, expect, vi, afterEach } from "vitest";
import { NoopMailer } from "@/infrastructure/mailer/noop.mailer";
import { Email } from "@/domain/shared/value-objects/email.vo";

describe("NoopMailer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should resolve without throwing", async () => {
    const mailer = new NoopMailer();
    const payload = {
      to: Email.create("user@example.com"),
      inviterName: "Alice",
      accountName: "Acme Corp",
      acceptUrl: "https://secret.example.com/invite/token123",
    };

    await expect(mailer.sendInvite(payload)).resolves.toBeUndefined();
  });

  it("should log with [mailer:noop] prefix", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const mailer = new NoopMailer();
    const payload = {
      to: Email.create("user@example.com"),
      inviterName: "Alice",
      accountName: "Acme Corp",
      acceptUrl: "https://secret.example.com/invite/token123",
    };

    await mailer.sendInvite(payload);

    expect(consoleSpy).toHaveBeenCalledOnce();
    const loggedMessage: string = consoleSpy.mock.calls[0][0];
    expect(loggedMessage).toContain("[mailer:noop]");
  });

  it("should log the email and account name", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const mailer = new NoopMailer();
    const payload = {
      to: Email.create("user@example.com"),
      inviterName: "Alice",
      accountName: "Acme Corp",
      acceptUrl: "https://secret.example.com/invite/token123",
    };

    await mailer.sendInvite(payload);

    const loggedMessage: string = consoleSpy.mock.calls[0][0];
    expect(loggedMessage).toContain("user@example.com");
    expect(loggedMessage).toContain("Acme Corp");
  });

  it("should NOT log the acceptUrl (sensitive data — LGPD)", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const mailer = new NoopMailer();
    const sensitiveUrl = "https://secret.example.com/invite/token123";
    const payload = {
      to: Email.create("user@example.com"),
      inviterName: "Alice",
      accountName: "Acme Corp",
      acceptUrl: sensitiveUrl,
    };

    await mailer.sendInvite(payload);

    const loggedMessage: string = consoleSpy.mock.calls[0][0];
    expect(loggedMessage).not.toContain(sensitiveUrl);
    expect(loggedMessage).not.toContain("token123");
  });

  it("should NOT log the inviterName or any other sensitive field", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const mailer = new NoopMailer();
    const payload = {
      to: Email.create("user@example.com"),
      inviterName: "SecretInviterName",
      accountName: "Acme Corp",
      acceptUrl: "https://secret.example.com/invite/token",
    };

    await mailer.sendInvite(payload);

    const loggedMessage: string = consoleSpy.mock.calls[0][0];
    expect(loggedMessage).not.toContain("SecretInviterName");
  });
});

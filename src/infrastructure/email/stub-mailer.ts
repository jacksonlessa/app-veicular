import type { Mailer, SendInvitePayload } from "@/application/ports/mailer";

export class StubMailer implements Mailer {
  async sendInvite(payload: SendInvitePayload): Promise<void> {
    console.log("[StubMailer] sendInvite:", payload);
  }
}

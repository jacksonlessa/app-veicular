import { Mailer, SendInvitePayload } from "@/application/ports/mailer";

export class NoopMailer implements Mailer {
  async sendInvite(payload: SendInvitePayload): Promise<void> {
    console.log(
      `[mailer:noop] sendInvite to=${payload.to.value} account=${payload.accountName}`,
    );
  }
}

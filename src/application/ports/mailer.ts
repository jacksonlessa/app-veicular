import { Email } from "@/domain/shared/value-objects/email.vo";

export type SendInvitePayload = {
  to: Email;
  inviterName: string;
  accountName: string;
  acceptUrl: string;
};

export interface Mailer {
  sendInvite(payload: SendInvitePayload): Promise<void>;
}

import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { Email } from "@/domain/shared/value-objects/email.vo";
import { InviteToken } from "@/domain/shared/value-objects/invite-token.vo";

export type InviteStatus = "pending" | "accepted" | "expired";

export interface InviteProps {
  id: string;
  accountId: string;
  email: Email;
  token: InviteToken;
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
}

export class Invite {
  private constructor(private props: InviteProps) {}

  static create(input: {
    id: string;
    accountId: string;
    email: Email;
    token: InviteToken;
    ttlHours: number;
    now?: Date;
  }): Invite {
    if (input.ttlHours <= 0) {
      throw new InvalidValueError("Invite.ttlHours", input.ttlHours);
    }
    const now = input.now ?? new Date();
    const expiresAt = new Date(now.getTime() + input.ttlHours * 60 * 60 * 1000);
    return new Invite({
      id: input.id,
      accountId: input.accountId,
      email: input.email,
      token: input.token,
      status: "pending",
      expiresAt,
      createdAt: now,
    });
  }

  static rehydrate(props: InviteProps): Invite {
    return new Invite(props);
  }

  get id(): string {
    return this.props.id;
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get email(): Email {
    return this.props.email;
  }

  get token(): InviteToken {
    return this.props.token;
  }

  get status(): InviteStatus {
    return this.props.status;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isExpired(now: Date): boolean {
    return now >= this.props.expiresAt;
  }

  isUsable(now: Date): boolean {
    return this.props.status === "pending" && !this.isExpired(now);
  }

  markAccepted(now: Date = new Date()): void {
    if (!this.isUsable(now)) {
      throw new BusinessRuleError(
        "invite.expired_or_used",
        "Invite is not in a usable state (already accepted or expired).",
      );
    }
    this.props.status = "accepted";
  }
}

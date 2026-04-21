import type { Email } from "@/domain/shared/value-objects/email.vo";
import type { InviteToken } from "@/domain/shared/value-objects/invite-token.vo";
import type { Invite } from "../entities/invite.entity";

export interface InviteRepository {
  findByToken(token: InviteToken): Promise<Invite | null>;
  findActivePending(accountId: string, email: Email): Promise<Invite | null>;
  create(invite: Invite): Promise<Invite>;
  update(invite: Invite): Promise<Invite>;
}

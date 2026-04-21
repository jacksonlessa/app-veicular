import { inviteRepository, accountRepository } from "@/infrastructure/container";
import { InviteToken } from "@/domain/shared/value-objects/invite-token.vo";
import AcceptInviteForm from "@/components/auth/AcceptInviteForm";
import InviteError from "@/components/auth/InviteError";

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: tokenParam } = await params;
  try {
    const token = InviteToken.create(tokenParam);
    const invite = await inviteRepository.findByToken(token);
    if (!invite || !invite.isUsable(new Date())) {
      return (
        <InviteError status={!invite ? "not_found" : "expired_or_used"} />
      );
    }
    const account = await accountRepository.findById(invite.accountId);
    return (
      <AcceptInviteForm
        token={tokenParam}
        email={invite.email.value}
        accountName={account!.name}
      />
    );
  } catch {
    return <InviteError status="not_found" />;
  }
}

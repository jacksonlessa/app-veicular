import AcceptInviteForm from "@/components/auth/AcceptInviteForm";
import InviteError from "@/components/auth/InviteError";

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: tokenParam } = await params;

  const baseUrl =
    process.env.NEXTAUTH_URL ?? process.env.APP_BASE_URL ?? "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/invites/${encodeURIComponent(tokenParam)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    const status =
      body.error === "invite.expired_or_used" ? "expired_or_used" : "not_found";
    return <InviteError status={status} />;
  }

  const { email, accountName } = (await res.json()) as {
    email: string;
    accountName: string;
  };

  return (
    <AcceptInviteForm token={tokenParam} email={email} accountName={accountName} />
  );
}

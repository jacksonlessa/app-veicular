export interface CreateAccountWithOwnerData {
  accountId: string;
  accountName: string;
  userId: string;
  userName: string;
  email: string;
  passwordHash: string;
  now: Date;
}

export interface AcceptInviteTransactionData {
  userId: string;
  accountId: string;
  name: string;
  email: string;
  passwordHash: string;
  inviteId: string;
  status: string;
  now: Date;
}

export interface TransactionRunner {
  createAccountWithOwner(data: CreateAccountWithOwnerData): Promise<void>;
  acceptInvite(data: AcceptInviteTransactionData): Promise<void>;
}

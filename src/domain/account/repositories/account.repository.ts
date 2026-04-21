import type { Account } from "../entities/account.entity";

export interface AccountRepository {
  findById(id: string): Promise<Account | null>;
  create(account: Account): Promise<Account>;
}

import type { Email } from "@/domain/shared/value-objects/email.vo";
import type { User } from "../entities/user.entity";

export interface UserRepository {
  findByEmail(email: Email): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<User>;
  countByAccount(accountId: string): Promise<number>;
}

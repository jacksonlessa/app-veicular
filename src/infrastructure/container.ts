import { prisma } from "@/infrastructure/database/prisma.client";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/prisma-user.repository";
import { PrismaAccountRepository } from "@/infrastructure/database/repositories/prisma-account.repository";
import { Argon2PasswordHasher } from "@/infrastructure/auth/password-hasher";
import { NoopMailer } from "@/infrastructure/mailer/noop.mailer";

export const userRepository = new PrismaUserRepository(prisma);
export const accountRepository = new PrismaAccountRepository(prisma);
export const hasher = new Argon2PasswordHasher();
export const mailer = new NoopMailer();

import { prisma } from "@/infrastructure/database/prisma.client";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/prisma-user.repository";
import { PrismaAccountRepository } from "@/infrastructure/database/repositories/prisma-account.repository";
import { PrismaInviteRepository } from "@/infrastructure/database/repositories/prisma-invite.repository";
import { PrismaTransactionRunner } from "@/infrastructure/database/prisma-transaction-runner";
import { Argon2PasswordHasher } from "@/infrastructure/auth/password-hasher";
import { RandomHexTokenGenerator } from "@/infrastructure/auth/token-generator";
import { NoopMailer } from "@/infrastructure/mailer/noop.mailer";
import { RegisterAccountUseCase } from "@/application/usecases/account/register-account.usecase";
import { InviteUserUseCase } from "@/application/usecases/account/invite-user.usecase";
import { AcceptInviteUseCase } from "@/application/usecases/account/accept-invite.usecase";
import { PrismaVehicleRepository } from "@/infrastructure/database/repositories/prisma-vehicle.repository";
import { ListVehiclesUseCase } from "@/application/usecases/vehicle/list-vehicles.usecase";
import { CreateVehicleUseCase } from "@/application/usecases/vehicle/create-vehicle.usecase";
import { UpdateVehicleUseCase } from "@/application/usecases/vehicle/update-vehicle.usecase";
import { DeleteVehicleUseCase } from "@/application/usecases/vehicle/delete-vehicle.usecase";

const baseUrl =
  process.env.NEXTAUTH_URL ?? process.env.APP_BASE_URL ?? "http://localhost:3000";

export const userRepository = new PrismaUserRepository(prisma);
export const accountRepository = new PrismaAccountRepository(prisma);
export const inviteRepository = new PrismaInviteRepository(prisma);
export const txRunner = new PrismaTransactionRunner(prisma);
export const hasher = new Argon2PasswordHasher();
export const tokenGenerator = new RandomHexTokenGenerator();

if (process.env.NODE_ENV === "production") {
  throw new Error("NoopMailer cannot be used in production — wire a real Mailer implementation");
}
export const mailer = new NoopMailer();

export const registerAccountUseCase = new RegisterAccountUseCase(
  userRepository,
  accountRepository,
  hasher,
  txRunner,
);

export const inviteUserUseCase = new InviteUserUseCase(
  userRepository,
  accountRepository,
  inviteRepository,
  mailer,
  tokenGenerator,
  baseUrl,
);

export const acceptInviteUseCase = new AcceptInviteUseCase(
  inviteRepository,
  userRepository,
  hasher,
  txRunner,
);

export const vehicleRepository = new PrismaVehicleRepository(prisma);

export const listVehiclesUseCase  = new ListVehiclesUseCase(vehicleRepository);
export const createVehicleUseCase = new CreateVehicleUseCase(vehicleRepository);
export const updateVehicleUseCase = new UpdateVehicleUseCase(vehicleRepository);
export const deleteVehicleUseCase = new DeleteVehicleUseCase(vehicleRepository);

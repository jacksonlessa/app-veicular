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
import { PrismaFuelupRepository } from "@/infrastructure/database/repositories/prisma-fuelup.repository";
import { RegisterFuelupUseCase } from "@/application/usecases/fuelup/register-fuelup.usecase";
import { UpdateFuelupUseCase } from "@/application/usecases/fuelup/update-fuelup.usecase";
import { DeleteFuelupUseCase } from "@/application/usecases/fuelup/delete-fuelup.usecase";
import { ListFuelupsUseCase } from "@/application/usecases/fuelup/list-fuelups.usecase";
import { GetFuelupUseCase } from "@/application/usecases/fuelup/get-fuelup.usecase";
import { PrismaMaintenanceRepository } from "@/infrastructure/database/repositories/prisma-maintenance.repository";
import { RegisterMaintenanceUseCase } from "@/application/usecases/maintenance/register-maintenance.usecase";
import { UpdateMaintenanceUseCase } from "@/application/usecases/maintenance/update-maintenance.usecase";
import { DeleteMaintenanceUseCase } from "@/application/usecases/maintenance/delete-maintenance.usecase";
import { GetMaintenanceUseCase } from "@/application/usecases/maintenance/get-maintenance.usecase";
import { ListMaintenancesUseCase } from "@/application/usecases/maintenance/list-maintenances.usecase";

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

export const fuelupRepository = new PrismaFuelupRepository(prisma);

export const registerFuelupUseCase = new RegisterFuelupUseCase(fuelupRepository, vehicleRepository, txRunner);
export const updateFuelupUseCase   = new UpdateFuelupUseCase(fuelupRepository, vehicleRepository, txRunner);
export const deleteFuelupUseCase   = new DeleteFuelupUseCase(fuelupRepository, vehicleRepository, txRunner);
export const listFuelupsUseCase    = new ListFuelupsUseCase(fuelupRepository, vehicleRepository);
export const getFuelupUseCase      = new GetFuelupUseCase(fuelupRepository, vehicleRepository);

export const maintenanceRepository = new PrismaMaintenanceRepository(prisma);

export const registerMaintenanceUseCase = new RegisterMaintenanceUseCase(maintenanceRepository, vehicleRepository, fuelupRepository, txRunner);
export const updateMaintenanceUseCase   = new UpdateMaintenanceUseCase(maintenanceRepository, vehicleRepository, fuelupRepository, txRunner);
export const deleteMaintenanceUseCase   = new DeleteMaintenanceUseCase(maintenanceRepository, fuelupRepository, vehicleRepository, txRunner);
export const getMaintenanceUseCase      = new GetMaintenanceUseCase(maintenanceRepository, vehicleRepository);
export const listMaintenancesUseCase    = new ListMaintenancesUseCase(maintenanceRepository, vehicleRepository);

import type { MaintenanceRepository } from "@/domain/maintenance/repositories/maintenance.repository";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import type { FuelupRepository } from "@/domain/fuel/repositories/fuelup.repository";
import type {
  TransactionRunner,
  SaveFuelupData,
  DeleteFuelupData,
  SaveMaintenanceData,
  DeleteMaintenanceData,
  CreateAccountWithOwnerData,
  AcceptInviteTransactionData,
} from "@/application/ports/transaction-runner";
import { Maintenance } from "@/domain/maintenance/entities/maintenance.entity";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";
import { Fuelup } from "@/domain/fuel/entities/fuelup.entity";

export class FakeMaintenanceRepository implements MaintenanceRepository {
  private store: Maintenance[] = [];

  seed(maintenances: Maintenance[]) {
    this.store = [...maintenances];
  }

  async findById(id: string): Promise<Maintenance | null> {
    return this.store.find((m) => m.id === id) ?? null;
  }

  async findByVehicle(vehicleId: string): Promise<Maintenance[]> {
    return this.store.filter((m) => m.vehicleId === vehicleId);
  }
}

export class FakeVehicleRepository implements VehicleRepository {
  private store: Vehicle[] = [];

  seed(vehicles: Vehicle[]) {
    this.store = [...vehicles];
  }

  async findById(id: string): Promise<Vehicle | null> {
    return this.store.find((v) => v.id === id) ?? null;
  }

  async findByAccount(accountId: string): Promise<Vehicle[]> {
    return this.store.filter((v) => v.accountId === accountId);
  }

  async create(vehicle: Vehicle): Promise<Vehicle> {
    this.store.push(vehicle);
    return vehicle;
  }

  async update(vehicle: Vehicle): Promise<Vehicle> {
    this.store = this.store.map((v) => (v.id === vehicle.id ? vehicle : v));
    return vehicle;
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((v) => v.id !== id);
  }
}

export class FakeFuelupRepository implements FuelupRepository {
  private store: Fuelup[] = [];

  seed(fuelups: Fuelup[]) {
    this.store = [...fuelups];
  }

  async findById(id: string): Promise<Fuelup | null> {
    return this.store.find((f) => f.id === id) ?? null;
  }

  async findByVehicle(vehicleId: string): Promise<Fuelup[]> {
    return this.store.filter((f) => f.vehicleId === vehicleId);
  }

  async findByVehiclePaginated(vehicleId: string, page: number, pageSize: number) {
    const all = await this.findByVehicle(vehicleId);
    const start = (page - 1) * pageSize;
    return { items: all.slice(start, start + pageSize), total: all.length };
  }

  async findLastByVehicle(vehicleId: string): Promise<Fuelup | null> {
    const all = await this.findByVehicle(vehicleId);
    return all[all.length - 1] ?? null;
  }

  async findLastKmlByVehicle(_vehicleId: string): Promise<number | null> {
    return null;
  }

  async create(fuelup: Fuelup): Promise<Fuelup> {
    this.store.push(fuelup);
    return fuelup;
  }

  async update(fuelup: Fuelup): Promise<Fuelup> {
    this.store = this.store.map((f) => (f.id === fuelup.id ? fuelup : f));
    return fuelup;
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((f) => f.id !== id);
  }
}

export class FakeTransactionRunner implements TransactionRunner {
  public lastSaveMaintenanceCall: SaveMaintenanceData | null = null;
  public lastDeleteMaintenanceCall: DeleteMaintenanceData | null = null;

  async createAccountWithOwner(_data: CreateAccountWithOwnerData): Promise<void> {}
  async acceptInvite(_data: AcceptInviteTransactionData): Promise<void> {}

  async saveFuelup(_data: SaveFuelupData): Promise<void> {
    throw new Error("not expected");
  }

  async deleteFuelup(_data: DeleteFuelupData): Promise<void> {
    throw new Error("not expected");
  }

  async saveMaintenance(data: SaveMaintenanceData): Promise<void> {
    this.lastSaveMaintenanceCall = data;
  }

  async deleteMaintenance(data: DeleteMaintenanceData): Promise<void> {
    this.lastDeleteMaintenanceCall = data;
  }
}

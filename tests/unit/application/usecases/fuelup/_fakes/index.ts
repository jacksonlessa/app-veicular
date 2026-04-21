import type { FuelupRepository } from "@/domain/fuel/repositories/fuelup.repository";
import type { VehicleRepository } from "@/domain/vehicle/repositories/vehicle.repository";
import type {
  TransactionRunner,
  SaveFuelupData,
  DeleteFuelupData,
  CreateAccountWithOwnerData,
  AcceptInviteTransactionData,
} from "@/application/ports/transaction-runner";
import { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import { Vehicle } from "@/domain/vehicle/entities/vehicle.entity";

export class FakeFuelupRepository implements FuelupRepository {
  private store: Fuelup[] = [];

  seed(fuelups: Fuelup[]) {
    this.store = [...fuelups];
  }

  async findById(id: string): Promise<Fuelup | null> {
    return this.store.find((f) => f.id === id) ?? null;
  }

  async findByVehicle(vehicleId: string): Promise<Fuelup[]> {
    return this.store
      .filter((f) => f.vehicleId === vehicleId)
      .sort((a, b) => {
        const d = a.date.value.getTime() - b.date.value.getTime();
        if (d !== 0) return d;
        const o = a.odometer.value - b.odometer.value;
        if (o !== 0) return o;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }

  async findByVehiclePaginated(vehicleId: string, page: number, pageSize: number) {
    const all = await this.findByVehicle(vehicleId);
    const start = (page - 1) * pageSize;
    return { items: all.slice(start, start + pageSize), total: all.length };
  }

  async findLastByVehicle(vehicleId: string): Promise<Fuelup | null> {
    const sorted = await this.findByVehicle(vehicleId);
    return sorted[sorted.length - 1] ?? null;
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

export class FakeTransactionRunner implements TransactionRunner {
  public lastSaveFuelupCall: SaveFuelupData | null = null;
  public lastDeleteFuelupCall: DeleteFuelupData | null = null;

  async createAccountWithOwner(_data: CreateAccountWithOwnerData): Promise<void> {}
  async acceptInvite(_data: AcceptInviteTransactionData): Promise<void> {}

  async saveFuelup(data: SaveFuelupData): Promise<void> {
    this.lastSaveFuelupCall = data;
  }

  async deleteFuelup(data: DeleteFuelupData): Promise<void> {
    this.lastDeleteFuelupCall = data;
  }
}

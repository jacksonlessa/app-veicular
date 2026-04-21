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

export interface SaveMaintenanceData {
  mode: "create" | "update";
  maintenance: {
    id: string;
    vehicleId: string;
    userId: string;
    date: Date;
    odometer: number | null;
    location: string | null;
    totalPrice: number;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  vehicleId: string;
  newCurrentOdometer?: number;
}

export interface DeleteMaintenanceData {
  maintenanceId: string;
  vehicleId: string;
  recalculateOdometer: boolean;
  newCurrentOdometer?: number;
}

export interface TransactionRunner {
  createAccountWithOwner(data: CreateAccountWithOwnerData): Promise<void>;
  acceptInvite(data: AcceptInviteTransactionData): Promise<void>;
  saveMaintenance(data: SaveMaintenanceData): Promise<void>;
  deleteMaintenance(data: DeleteMaintenanceData): Promise<void>;
}

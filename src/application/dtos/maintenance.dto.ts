import type { Maintenance } from "@/domain/maintenance/entities/maintenance.entity";

export interface MaintenanceItemDTO {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface MaintenanceDTO {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number | null;
  description: string | null;
  totalPrice: number;
  items: MaintenanceItemDTO[];
  createdAt: string;
}

export function toMaintenanceDTO(maintenance: Maintenance): MaintenanceDTO {
  return {
    id: maintenance.id,
    vehicleId: maintenance.vehicleId,
    date: maintenance.date.value.toISOString(),
    odometer: maintenance.odometer ? maintenance.odometer.value : null,
    description: maintenance.location ?? null,
    totalPrice: maintenance.totalPrice,
    items: maintenance.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity.value,
      unitPrice: item.unitPrice.value,
      subtotal: item.subtotal,
    })),
    createdAt: maintenance.createdAt.toISOString(),
  };
}

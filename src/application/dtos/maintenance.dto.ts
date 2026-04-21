import type { Maintenance } from "@/domain/maintenance/entities/maintenance.entity";

export type MaintenanceDTO = {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number | null;
  description: string | null;
  totalPrice: number;
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  createdAt: string;
};

export function toMaintenanceDTO(entity: Maintenance): MaintenanceDTO {
  return {
    id: entity.id,
    vehicleId: entity.vehicleId,
    date: entity.date.value.toISOString(),
    odometer: entity.odometer?.value ?? null,
    description: entity.location ?? null,
    totalPrice: entity.totalPrice,
    items: entity.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity.value,
      unitPrice: item.unitPrice.value,
      subtotal: item.subtotal,
    })),
    createdAt: entity.createdAt.toISOString(),
  };
}

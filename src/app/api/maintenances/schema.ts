import { z } from "zod";

const MaintenanceItemInputSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
});

export const CreateMaintenanceSchema = z.object({
  vehicleId: z.string().cuid(),
  date: z.string().datetime(),
  odometer: z.number().int().positive().optional(),
  description: z.string().optional(),
  items: z.array(MaintenanceItemInputSchema).min(1),
});

export const UpdateMaintenanceSchema = CreateMaintenanceSchema.omit({ vehicleId: true });

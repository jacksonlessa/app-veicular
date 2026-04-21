import { z } from "zod";

export const CreateFuelupSchema = z.object({
  vehicleId: z.string().min(1),
  date: z.string().datetime(),
  odometer: z.number().int().nonnegative(),
  fuelType: z.string().min(1),
  fullTank: z.boolean(),
  liters: z.number().positive().optional(),
  pricePerLiter: z.number().positive().optional(),
  totalPrice: z.number().positive().optional(),
});

export const UpdateFuelupSchema = z.object({
  date: z.string().datetime().optional(),
  odometer: z.number().int().nonnegative().optional(),
  fuelType: z.string().min(1).optional(),
  fullTank: z.boolean().optional(),
  liters: z.number().positive().optional(),
  pricePerLiter: z.number().positive().optional(),
  totalPrice: z.number().positive().optional(),
});

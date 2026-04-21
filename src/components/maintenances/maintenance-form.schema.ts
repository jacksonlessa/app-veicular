import { z } from "zod";

export const maintenanceItemSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  quantity: z.coerce.number().positive("Quantidade deve ser > 0"),
  unitPrice: z.coerce.number().positive("Valor unitário deve ser > 0"),
});

export const maintenanceFormSchema = z.object({
  vehicleId: z.string().min(1, "Selecione um veículo"),
  date: z
    .string()
    .min(1, "Data obrigatória")
    .refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d <= new Date();
    }, "Data não pode ser futura"),
  odometer: z.coerce
    .number()
    .int("Odômetro deve ser inteiro")
    .positive("Odômetro deve ser > 0")
    .optional()
    .or(z.literal("")),
  description: z.string().optional(),
  items: z
    .array(maintenanceItemSchema)
    .min(1, "Adicione ao menos um item"),
});

export type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;
export type MaintenanceItemValues = z.infer<typeof maintenanceItemSchema>;

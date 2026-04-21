import { z } from "zod";

export const FUEL_TYPES = [
  { value: "GASOLINE", label: "Gasolina" },
  { value: "GASOLINE_ADDITIVE", label: "Gasolina Aditivada" },
  { value: "ETHANOL", label: "Etanol" },
  { value: "DIESEL", label: "Diesel" },
  { value: "GNV", label: "GNV" },
  { value: "ELECTRIC", label: "Elétrico" },
] as const;

export const fuelupFormSchema = z
  .object({
    vehicleId: z.string().min(1, "Veículo obrigatório"),
    date: z
      .string()
      .min(1, "Data obrigatória")
      .refine((val) => {
        const d = new Date(val);
        return !isNaN(d.getTime()) && d <= new Date();
      }, "Data não pode ser futura"),
    odometer: z
      .number()
      .int("Odômetro deve ser inteiro")
      .nonnegative("Odômetro deve ser >= 0"),
    fuelType: z
      .string()
      .min(1, "Combustível obrigatório")
      .refine(
        (v) => FUEL_TYPES.map((f) => f.value).includes(v as never),
        "Tipo de combustível inválido"
      ),
    fullTank: z.boolean(),
    liters: z.number().positive("Litros deve ser > 0").optional(),
    pricePerLiter: z.number().positive("Preço deve ser > 0").optional(),
    totalPrice: z.number().positive("Total deve ser > 0").optional(),
  })
  .superRefine((data, ctx) => {
    const provided = [data.liters, data.pricePerLiter, data.totalPrice].filter(
      (v) => v !== undefined && v !== null
    );
    if (provided.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Preencha pelo menos 2 dos 3 campos: Litros, R$/Litro ou Total",
        path: ["liters"],
      });
    }
  });

export type FuelupFormValues = z.infer<typeof fuelupFormSchema>;

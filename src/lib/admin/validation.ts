import { z } from "zod";

const requiredName = z.string().trim().min(2).max(120);
const moneyRubles = z.coerce.number().int().min(0).max(1_000_000);

export const serviceInputSchema = z.object({
  name: requiredName,
  category: z.enum(["MANICURE", "PEDICURE"]),
  durationMinutes: z.coerce.number().int().min(15).max(480),
  priceRubles: moneyRubles,
  description: z.string().trim().max(500).optional().default(""),
});

export const addonInputSchema = z
  .object({
    name: requiredName,
    priceType: z.enum(["INCLUDED", "FIXED", "FROM"]),
    priceRubles: moneyRubles.optional(),
  })
  .superRefine((value, context) => {
    if (value.priceType !== "INCLUDED" && value.priceRubles === undefined) {
      context.addIssue({ code: "custom", path: ["priceRubles"], message: "Укажите цену" });
    }
  });

export const settingsInputSchema = z.object({
  minimumLeadMinutes: z.coerce.number().int().min(0).max(10_080),
  bookingHorizonDays: z.coerce.number().int().min(1).max(365),
});

export const staffInputSchema = z.object({
  displayName: requiredName,
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export function parseId(value: unknown): string {
  return z.string().uuid().parse(value);
}

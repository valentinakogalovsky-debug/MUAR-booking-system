import { createHash } from "node:crypto";
import { z } from "zod";
import { normalizePhone } from "../auth/phone";

const customerNameSchema = z.string().trim().min(1).max(80);

export const bookingRequestSchema = z.object({
  serviceIds: z.array(z.string().uuid()).length(1),
  staffId: z.string().uuid(),
  startAt: z
    .string()
    .datetime({ offset: true })
    .transform((value) => new Date(value)),
  customer: z.object({
    firstName: customerNameSchema,
    lastName: customerNameSchema,
    phone: z
      .string()
      .trim()
      .transform((value, context) => {
        const phone = normalizePhone(value);
        if (!phone) {
          context.addIssue({ code: "custom", message: "Некорректный номер телефона" });
          return z.NEVER;
        }
        return phone;
      }),
  }),
});

export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(200)
  .regex(/^[A-Za-z0-9._:-]+$/);

export function bookingRequestHash(value: z.output<typeof bookingRequestSchema>) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        serviceIds: value.serviceIds,
        staffId: value.staffId,
        startAt: value.startAt.toISOString(),
        customer: value.customer,
      }),
    )
    .digest("hex");
}

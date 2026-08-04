import { describe, expect, it } from "vitest";
import { bookingRequestHash, bookingRequestSchema, idempotencyKeySchema } from "./validation";

const request = {
  serviceIds: ["f68ff8ab-9f37-4f8a-a40e-b5362fd7aca3"],
  staffId: "bd0cc992-bd55-46fa-8374-6e7f8dbe7f67",
  startAt: "2026-08-10T09:00:00+03:00",
  customer: { firstName: " Анна ", lastName: "Иванова", phone: "8 900 000-00-00" },
};

describe("booking request validation", () => {
  it("normalizes contacts and time before hashing", () => {
    const parsed = bookingRequestSchema.parse(request);
    expect(parsed.customer).toEqual({
      firstName: "Анна",
      lastName: "Иванова",
      phone: "+79000000000",
    });
    expect(parsed.startAt.toISOString()).toBe("2026-08-10T06:00:00.000Z");
    expect(bookingRequestHash(parsed)).toHaveLength(64);
  });

  it("accepts exactly one catalog service", () => {
    expect(bookingRequestSchema.safeParse({ ...request, serviceIds: [] }).success).toBe(false);
    expect(
      bookingRequestSchema.safeParse({
        ...request,
        serviceIds: [...request.serviceIds, request.staffId],
      }).success,
    ).toBe(false);
  });

  it("requires a valid phone and idempotency key", () => {
    expect(
      bookingRequestSchema.safeParse({
        ...request,
        customer: { ...request.customer, phone: "123" },
      }).success,
    ).toBe(false);
    expect(idempotencyKeySchema.safeParse("short").success).toBe(false);
    expect(idempotencyKeySchema.safeParse("booking:request-2026_08_10").success).toBe(true);
  });
});

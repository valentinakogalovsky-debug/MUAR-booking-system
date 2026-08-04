import "server-only";

import { z } from "zod";
import type { AdminActor } from "@/lib/admin/catalog";
import { getDb } from "@/lib/db";

const bookingIdSchema = z.string().uuid();
const cancellationSchema = z.object({ reason: z.string().trim().min(2).max(300) });

export class BookingStateError extends Error {}

export function listBookingRequests(organizationId: string, status = "PENDING") {
  const parsedStatus = z.enum(["PENDING", "CONFIRMED", "CANCELLED"]).parse(status);
  return getDb().booking.findMany({
    where: { organizationId, status: parsedStatus },
    orderBy: { startAt: "asc" },
    take: 100,
    include: {
      customer: { select: { firstName: true, lastName: true, phone: true } },
      staff: { select: { id: true, displayName: true } },
      services: { orderBy: { position: "asc" } },
    },
  });
}

export async function confirmBooking(actor: AdminActor, rawId: string) {
  const id = bookingIdSchema.parse(rawId);
  return getDb().$transaction(async (tx) => {
    const booking = await tx.booking.findFirstOrThrow({
      where: { id, organizationId: actor.organizationId },
    });
    if (booking.status === "CONFIRMED") return booking;
    if (booking.status !== "PENDING") {
      throw new BookingStateError("Подтвердить можно только ожидающую заявку");
    }
    const result = await tx.booking.updateMany({
      where: { id, organizationId: actor.organizationId, status: "PENDING" },
      data: { status: "CONFIRMED" },
    });
    if (result.count !== 1) throw new BookingStateError("Статус заявки уже изменился");
    const updated = await tx.booking.findUniqueOrThrow({ where: { id } });
    await tx.bookingHistory.create({
      data: {
        bookingId: id,
        changedById: actor.userId,
        action: "CONFIRMED",
        previousData: { status: booking.status },
        newData: { status: "CONFIRMED" },
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "BOOKING_CONFIRMED",
        entityType: "BOOKING",
        entityId: id,
      },
    });
    return updated;
  });
}

export async function cancelBooking(actor: AdminActor, rawId: string, input: unknown) {
  const id = bookingIdSchema.parse(rawId);
  const { reason } = cancellationSchema.parse(input);
  return getDb().$transaction(async (tx) => {
    const booking = await tx.booking.findFirstOrThrow({
      where: { id, organizationId: actor.organizationId },
    });
    if (booking.status === "CANCELLED") return booking;
    if (!(["PENDING", "CONFIRMED"] as const).includes(booking.status as "PENDING" | "CONFIRMED")) {
      throw new BookingStateError("Эту запись уже нельзя отменить");
    }
    const cancelledAt = new Date();
    const result = await tx.booking.updateMany({
      where: {
        id,
        organizationId: actor.organizationId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      data: { status: "CANCELLED", cancelledAt, cancellationReason: reason },
    });
    if (result.count !== 1) throw new BookingStateError("Статус записи уже изменился");
    const updated = await tx.booking.findUniqueOrThrow({ where: { id } });
    await tx.bookingHistory.create({
      data: {
        bookingId: id,
        changedById: actor.userId,
        action: "CANCELLED",
        previousData: { status: booking.status },
        newData: { status: "CANCELLED", reason },
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "BOOKING_CANCELLED",
        entityType: "BOOKING",
        entityId: id,
        metadata: { reason },
      },
    });
    return updated;
  });
}

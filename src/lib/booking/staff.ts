import "server-only";

import { z } from "zod";
import { getDb } from "@/lib/db";
import { addDays, parseDate, studioDateTimeToUtc } from "@/lib/schedule/time";
import { BookingStateError } from "./admin";
import { canStaffSetFinalStatus } from "./staff-rules";

export type StaffActor = {
  userId: string;
  organizationId: string;
  staffProfileId: string;
};

const bookingIdSchema = z.string().uuid();
const finalStatusSchema = z.enum(["COMPLETED", "NO_SHOW"]);

export async function listStaffBookings(actor: StaffActor, from: string, days: number) {
  const date = parseDate(from);
  const range = z.number().int().min(1).max(7).parse(days);
  const organization = await getDb().organization.findUniqueOrThrow({
    where: { id: actor.organizationId },
    select: { timezone: true },
  });
  const startAt = studioDateTimeToUtc(date, 0, organization.timezone);
  const endAt = studioDateTimeToUtc(addDays(date, range), 0, organization.timezone);
  const bookings = await getDb().booking.findMany({
    where: {
      organizationId: actor.organizationId,
      staffId: actor.staffProfileId,
      startAt: { gte: startAt, lt: endAt },
      status: { in: ["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"] },
    },
    orderBy: { startAt: "asc" },
    include: {
      customer: { select: { firstName: true, lastName: true, phone: true } },
      services: { orderBy: { position: "asc" } },
    },
  });
  return { bookings, timezone: organization.timezone };
}

export async function setStaffBookingStatus(actor: StaffActor, rawId: string, rawStatus: string) {
  const id = bookingIdSchema.parse(rawId);
  const status = finalStatusSchema.parse(rawStatus);
  return getDb().$transaction(async (tx) => {
    const booking = await tx.booking.findFirstOrThrow({
      where: {
        id,
        organizationId: actor.organizationId,
        staffId: actor.staffProfileId,
      },
    });
    if (booking.status === status) return booking;
    if (!canStaffSetFinalStatus(booking.status, status)) {
      throw new BookingStateError("Изменить можно только подтверждённую запись");
    }
    const result = await tx.booking.updateMany({
      where: {
        id,
        organizationId: actor.organizationId,
        staffId: actor.staffProfileId,
        status: "CONFIRMED",
      },
      data: { status },
    });
    if (result.count !== 1) throw new BookingStateError("Статус записи уже изменился");
    await tx.bookingHistory.create({
      data: {
        bookingId: id,
        changedById: actor.userId,
        action: status,
        previousData: { status: booking.status },
        newData: { status },
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: `BOOKING_${status}`,
        entityType: "BOOKING",
        entityId: id,
      },
    });
    return tx.booking.findUniqueOrThrow({ where: { id } });
  });
}

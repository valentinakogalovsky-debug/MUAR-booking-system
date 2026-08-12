import "server-only";

import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type { AdminActor } from "@/lib/admin/catalog";
import { generateAvailableStarts } from "@/lib/availability/calculate";
import { getDb } from "@/lib/db";
import { calculateWorkingIntervals } from "@/lib/schedule/calculate";
import {
  addDays,
  parseDate,
  parseTimeToMinutes,
  studioDate,
  studioDateTimeToUtc,
} from "@/lib/schedule/time";

const bookingIdSchema = z.string().uuid();
const cancellationSchema = z.object({ reason: z.string().trim().min(2).max(300) });

export class BookingStateError extends Error {}

function isBookingConflict(error: unknown) {
  const pending: unknown[] = [error];
  const visited = new Set<unknown>();
  while (pending.length > 0 && visited.size < 30) {
    const current = pending.shift();
    if (!current || typeof current !== "object" || visited.has(current)) continue;
    visited.add(current);
    const record = current as Record<string, unknown>;
    if (["23P01", "23505", "P2034"].includes(String(record.code))) return true;
    pending.push(...Object.values(record));
  }
  return false;
}

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

const scheduleFilterSchema = z.object({
  date: z.string().transform(parseDate),
  days: z.number().int().min(1).max(7),
  staffId: z.string().uuid().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
});

export async function listAdminSchedule(
  organizationId: string,
  input: { date: string; days: number; staffId?: string; status?: string },
) {
  const value = scheduleFilterSchema.parse(input);
  const organization = await getDb().organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { timezone: true },
  });
  const startAt = studioDateTimeToUtc(value.date, 0, organization.timezone);
  const endAt = studioDateTimeToUtc(addDays(value.date, value.days), 0, organization.timezone);
  const [staff, bookings] = await Promise.all([
    getDb().staffProfile.findMany({
      where: { organizationId, isActive: true },
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true },
    }),
    getDb().booking.findMany({
      where: {
        organizationId,
        startAt: { gte: startAt, lt: endAt },
        ...(value.staffId ? { staffId: value.staffId } : {}),
        ...(value.status ? { status: value.status } : {}),
      },
      orderBy: [{ startAt: "asc" }, { staff: { displayName: "asc" } }],
      take: 250,
      include: {
        customer: { select: { firstName: true, lastName: true, phone: true } },
        staff: { select: { id: true, displayName: true } },
        services: { orderBy: { position: "asc" } },
      },
    }),
  ]);
  return { staff, bookings, timezone: organization.timezone };
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

const rescheduleSchema = z.object({
  staffId: z.string().uuid(),
  date: z.string().transform(parseDate),
  time: z.string().transform(parseTimeToMinutes),
});

export async function getAdminBookingForReschedule(organizationId: string, rawId: string) {
  const id = bookingIdSchema.parse(rawId);
  return getDb().booking.findFirstOrThrow({
    where: {
      id,
      organizationId,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: {
      customer: { select: { firstName: true, lastName: true, phone: true } },
      staff: { select: { id: true, displayName: true } },
      services: { orderBy: { position: "asc" } },
    },
  });
}

export async function rescheduleBooking(actor: AdminActor, rawId: string, input: unknown) {
  const id = bookingIdSchema.parse(rawId);
  const value = rescheduleSchema.parse(input);
  try {
    return await getDb().$transaction(
      async (tx) => {
        const organization = await tx.organization.findUniqueOrThrow({
          where: { id: actor.organizationId },
          select: { timezone: true, settings: true },
        });
        if (!organization.settings) throw new BookingStateError("Настройки студии не найдены");
        const booking = await tx.booking.findFirstOrThrow({
          where: { id, organizationId: actor.organizationId },
          include: { services: { orderBy: { position: "asc" } } },
        });
        if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
          throw new BookingStateError("Эту запись уже нельзя перенести");
        }
        const serviceItem = booking.services[0];
        if (!serviceItem) throw new BookingStateError("У записи не найдена услуга");
        const startAt = studioDateTimeToUtc(value.date, value.time, organization.timezone);
        const date = studioDate(startAt, organization.timezone);
        const dayStart = studioDateTimeToUtc(date, 0, organization.timezone);
        const dayEnd = studioDateTimeToUtc(date, 1440, organization.timezone);
        const now = new Date();
        const today = studioDate(now, organization.timezone);
        const lastDate = addDays(today, organization.settings.bookingHorizonDays);
        const earliestStart = new Date(
          now.getTime() + organization.settings.minimumLeadMinutes * 60_000,
        );
        if (date < today || date > lastDate) {
          throw new BookingStateError("Дата находится вне доступного периода записи");
        }
        const staff = await tx.staffProfile.findFirst({
          where: {
            id: value.staffId,
            organizationId: actor.organizationId,
            isActive: true,
            services: { some: { serviceId: serviceItem.serviceId } },
          },
          include: {
            schedules: true,
            exceptions: { where: { startAt: { lt: dayEnd }, endAt: { gt: dayStart } } },
            bookings: {
              where: {
                id: { not: id },
                status: { in: ["PENDING", "CONFIRMED"] },
                startAt: { lt: dayEnd },
                occupiedUntil: { gt: dayStart },
              },
              select: { startAt: true, occupiedUntil: true },
            },
          },
        });
        if (!staff) throw new BookingStateError("Мастер не найден или не выполняет услугу");
        const availableStarts = generateAvailableStarts({
          workingIntervals: calculateWorkingIntervals(
            date,
            organization.timezone,
            staff.schedules,
            staff.exceptions,
          ),
          busyIntervals: staff.bookings,
          durationMinutes: serviceItem.durationMinutesSnapshot,
          technicalBreakMinutes: organization.settings.technicalBreakMinutes,
          slotStepMinutes: organization.settings.slotStepMinutes,
          earliestStart,
        });
        if (!availableStarts.some((item) => item.getTime() === startAt.getTime())) {
          throw new BookingStateError("Новое время недоступно");
        }
        const endAt = new Date(startAt.getTime() + serviceItem.durationMinutesSnapshot * 60_000);
        const occupiedUntil = new Date(
          endAt.getTime() + organization.settings.technicalBreakMinutes * 60_000,
        );
        const updated = await tx.booking.update({
          where: { id },
          data: { staffId: staff.id, startAt, endAt, occupiedUntil },
        });
        await tx.bookingHistory.create({
          data: {
            bookingId: id,
            changedById: actor.userId,
            action: "RESCHEDULED",
            previousData: { staffId: booking.staffId, startAt: booking.startAt },
            newData: { staffId: staff.id, startAt },
          },
        });
        await tx.auditLog.create({
          data: {
            organizationId: actor.organizationId,
            userId: actor.userId,
            action: "BOOKING_RESCHEDULED",
            entityType: "BOOKING",
            entityId: id,
          },
        });
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (isBookingConflict(error)) {
      throw new BookingStateError("Новое время уже занято. Прежняя запись сохранена");
    }
    throw error;
  }
}

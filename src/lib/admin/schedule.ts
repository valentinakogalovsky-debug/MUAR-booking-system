import "server-only";

import { AuditEntityType, ExceptionType } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import type { AdminActor } from "./catalog";
import { calculateWorkingIntervals } from "@/lib/schedule/calculate";
import { parseDate, parseTimeToMinutes, studioDateTimeToUtc } from "@/lib/schedule/time";
import { z } from "zod";

export const exceptionCategorySchema = z.enum([
  "VACATION",
  "SICK_LEAVE",
  "DAY_OFF",
  "EXTRA_SHIFT",
  "SHORT_SHIFT",
  "BLOCK",
]);

const exceptionInputSchema = z.object({
  staffId: z.string().uuid(),
  category: exceptionCategorySchema,
  dateFrom: z.string(),
  dateTo: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  note: z.string().trim().max(200).optional().default(""),
});

export async function getScheduleOverview(organizationId: string, date: string) {
  parseDate(date);
  const db = getDb();
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { timezone: true },
  });
  const dayStart = studioDateTimeToUtc(date, 0, organization.timezone);
  const dayEnd = studioDateTimeToUtc(date, 1440, organization.timezone);
  const staff = await db.staffProfile.findMany({
    where: { organizationId, isActive: true },
    orderBy: { displayName: "asc" },
    include: {
      schedules: true,
      exceptions: { where: { startAt: { lt: dayEnd }, endAt: { gt: dayStart } } },
    },
  });
  return {
    timezone: organization.timezone,
    staff: staff.map((master) => ({
      id: master.id,
      displayName: master.displayName,
      intervals: calculateWorkingIntervals(
        date,
        organization.timezone,
        master.schedules,
        master.exceptions,
      ),
      exceptions: master.exceptions,
    })),
  };
}

export async function listUpcomingExceptions(organizationId: string, fromDate: string) {
  const organization = await getDb().organization.findUniqueOrThrow({
    where: { id: organizationId },
  });
  return getDb().availabilityException.findMany({
    where: {
      organizationId,
      endAt: { gt: studioDateTimeToUtc(parseDate(fromDate), 0, organization.timezone) },
    },
    orderBy: { startAt: "asc" },
    take: 100,
    include: { staff: { select: { displayName: true } } },
  });
}

export async function createException(actor: AdminActor, input: unknown) {
  const value = exceptionInputSchema.parse(input);
  const dateFrom = parseDate(value.dateFrom);
  const dateTo = parseDate(value.dateTo || value.dateFrom);
  if (dateTo < dateFrom) throw new Error("Дата окончания раньше даты начала");

  const organization = await getDb().organization.findUniqueOrThrow({
    where: { id: actor.organizationId },
    select: { timezone: true },
  });
  const allDay = ["VACATION", "SICK_LEAVE", "DAY_OFF"].includes(value.category);
  const startMinute = allDay ? 0 : parseTimeToMinutes(value.startTime || "");
  const endMinute = allDay ? 1440 : parseTimeToMinutes(value.endTime || "");
  if (!allDay && endMinute <= startMinute) throw new Error("Конец должен быть позже начала");
  const type = ["EXTRA_SHIFT", "SHORT_SHIFT"].includes(value.category)
    ? ExceptionType.AVAILABLE
    : ExceptionType.UNAVAILABLE;

  return getDb().$transaction(async (tx) => {
    await tx.staffProfile.findFirstOrThrow({
      where: { id: value.staffId, organizationId: actor.organizationId },
    });
    const exception = await tx.availabilityException.create({
      data: {
        organizationId: actor.organizationId,
        staffId: value.staffId,
        type,
        startAt: studioDateTimeToUtc(dateFrom, startMinute, organization.timezone),
        endAt: studioDateTimeToUtc(dateTo, endMinute, organization.timezone),
        reason: `${value.category}${value.note ? `: ${value.note}` : ""}`,
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "SCHEDULE_EXCEPTION_CREATED",
        entityType: AuditEntityType.SCHEDULE,
        entityId: exception.id,
        metadata: { staffId: value.staffId, category: value.category },
      },
    });
    return exception;
  });
}

export async function removeException(actor: AdminActor, id: string) {
  z.string().uuid().parse(id);
  return getDb().$transaction(async (tx) => {
    await tx.availabilityException.findFirstOrThrow({
      where: { id, organizationId: actor.organizationId },
    });
    await tx.availabilityException.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "SCHEDULE_EXCEPTION_DELETED",
        entityType: AuditEntityType.SCHEDULE,
        entityId: id,
      },
    });
  });
}

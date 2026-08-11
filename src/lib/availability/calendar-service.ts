import "server-only";

import { z } from "zod";
import { getDb } from "@/lib/db";
import { calculateWorkingIntervals } from "@/lib/schedule/calculate";
import { addDays, studioDate, studioDateTimeToUtc } from "@/lib/schedule/time";
import { datesInMonth } from "./calendar";
import { BLOCKING_BOOKING_STATUSES, generateAvailableStarts } from "./calculate";
import { AvailabilityError } from "./service";

const calendarInputSchema = z.object({
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  month: z.string(),
});

export async function getAvailabilityCalendar(input: unknown, now = new Date()) {
  const parsed = calendarInputSchema.safeParse(input);
  if (!parsed.success) throw new AvailabilityError("Проверьте параметры запроса", "INVALID_INPUT");

  let dates: string[];
  try {
    dates = datesInMonth(parsed.data.month);
  } catch {
    throw new AvailabilityError("Проверьте месяц", "INVALID_INPUT");
  }

  const db = getDb();
  const organization = await db.organization.findUniqueOrThrow({
    where: { slug: "muare" },
    select: { id: true, timezone: true, settings: true },
  });
  if (!organization.settings) throw new AvailabilityError("Настройки не найдены", "INVALID_INPUT");

  const service = await db.service.findFirst({
    where: { id: parsed.data.serviceId, organizationId: organization.id, isActive: true },
    select: { id: true, durationMinutes: true },
  });
  if (!service) throw new AvailabilityError("Услуга не найдена", "SERVICE_NOT_FOUND");

  const monthStart = studioDateTimeToUtc(dates[0], 0, organization.timezone);
  const monthEnd = studioDateTimeToUtc(addDays(dates.at(-1)!, 1), 0, organization.timezone);
  const staff = await db.staffProfile.findMany({
    where: {
      organizationId: organization.id,
      isActive: true,
      ...(parsed.data.staffId ? { id: parsed.data.staffId } : {}),
      services: { some: { serviceId: service.id } },
    },
    orderBy: { displayName: "asc" },
    include: {
      schedules: true,
      exceptions: { where: { startAt: { lt: monthEnd }, endAt: { gt: monthStart } } },
      bookings: {
        where: {
          status: { in: [...BLOCKING_BOOKING_STATUSES] },
          startAt: { lt: monthEnd },
          occupiedUntil: { gt: monthStart },
        },
        select: { startAt: true, occupiedUntil: true },
      },
    },
  });
  if (parsed.data.staffId && staff.length === 0) {
    throw new AvailabilityError("Мастер не найден", "STAFF_NOT_FOUND");
  }

  const today = studioDate(now, organization.timezone);
  const lastDate = addDays(today, organization.settings.bookingHorizonDays);
  const leadTime = new Date(now.getTime() + organization.settings.minimumLeadMinutes * 60_000);
  const availableDates = dates.flatMap((date) => {
    if (date < today || date > lastDate) return [];
    const dayStart = studioDateTimeToUtc(date, 0, organization.timezone);
    const dayEnd = studioDateTimeToUtc(date, 1440, organization.timezone);
    const staffIds = staff.flatMap((master) => {
      const starts = generateAvailableStarts({
        workingIntervals: calculateWorkingIntervals(
          date,
          organization.timezone,
          master.schedules,
          master.exceptions.filter(
            (exception) => exception.startAt < dayEnd && exception.endAt > dayStart,
          ),
        ),
        busyIntervals: master.bookings.filter(
          (booking) => booking.startAt < dayEnd && booking.occupiedUntil > dayStart,
        ),
        durationMinutes: service.durationMinutes,
        technicalBreakMinutes: organization.settings!.technicalBreakMinutes,
        slotStepMinutes: organization.settings!.slotStepMinutes,
        earliestStart: leadTime > dayStart ? leadTime : dayStart,
      });
      return starts.length > 0 ? [master.id] : [];
    });
    return staffIds.length > 0 ? [{ date, staffIds }] : [];
  });

  return {
    month: parsed.data.month,
    timezone: organization.timezone,
    constraints: {
      bookingHorizonDays: organization.settings.bookingHorizonDays,
      minimumLeadMinutes: organization.settings.minimumLeadMinutes,
    },
    dates: availableDates,
  };
}

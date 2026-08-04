import "server-only";

import { z } from "zod";
import { getDb } from "@/lib/db";
import { calculateWorkingIntervals } from "@/lib/schedule/calculate";
import { addDays, parseDate, studioDate, studioDateTimeToUtc } from "@/lib/schedule/time";
import { BLOCKING_BOOKING_STATUSES, generateAvailableStarts } from "./calculate";

const availabilityInputSchema = z.object({
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  date: z.string(),
});

export class AvailabilityError extends Error {
  constructor(
    message: string,
    readonly code: "INVALID_INPUT" | "SERVICE_NOT_FOUND" | "STAFF_NOT_FOUND",
  ) {
    super(message);
  }
}

export async function getAvailability(input: unknown, now = new Date()) {
  const parsed = availabilityInputSchema.safeParse(input);
  if (!parsed.success) throw new AvailabilityError("Проверьте параметры запроса", "INVALID_INPUT");

  let date: string;
  try {
    date = parseDate(parsed.data.date);
  } catch {
    throw new AvailabilityError("Проверьте дату", "INVALID_INPUT");
  }

  const db = getDb();
  const organization = await db.organization.findUniqueOrThrow({
    where: { slug: "muare" },
    select: { id: true, timezone: true, settings: true },
  });
  if (!organization.settings) throw new AvailabilityError("Настройки не найдены", "INVALID_INPUT");

  const today = studioDate(now, organization.timezone);
  const lastDate = addDays(today, organization.settings.bookingHorizonDays);
  const withinOnlineWindow = date >= today && date <= lastDate;

  const service = await db.service.findFirst({
    where: { id: parsed.data.serviceId, organizationId: organization.id, isActive: true },
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      priceMinor: true,
      currency: true,
    },
  });
  if (!service) throw new AvailabilityError("Услуга не найдена", "SERVICE_NOT_FOUND");

  const dayStart = studioDateTimeToUtc(date, 0, organization.timezone);
  const dayEnd = studioDateTimeToUtc(date, 1440, organization.timezone);
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
      exceptions: { where: { startAt: { lt: dayEnd }, endAt: { gt: dayStart } } },
      bookings: {
        where: {
          status: { in: [...BLOCKING_BOOKING_STATUSES] },
          startAt: { lt: dayEnd },
          occupiedUntil: { gt: dayStart },
        },
        select: { startAt: true, occupiedUntil: true },
      },
    },
  });
  if (parsed.data.staffId && staff.length === 0) {
    throw new AvailabilityError("Мастер не найден", "STAFF_NOT_FOUND");
  }

  const earliestStart = new Date(
    Math.max(dayStart.getTime(), now.getTime() + organization.settings.minimumLeadMinutes * 60_000),
  );
  const masters = staff.map((master) => {
    const workingIntervals = calculateWorkingIntervals(
      date,
      organization.timezone,
      master.schedules,
      master.exceptions,
    );
    const starts = withinOnlineWindow
      ? generateAvailableStarts({
          workingIntervals,
          busyIntervals: master.bookings,
          durationMinutes: service.durationMinutes,
          technicalBreakMinutes: organization.settings!.technicalBreakMinutes,
          slotStepMinutes: organization.settings!.slotStepMinutes,
          earliestStart,
        })
      : [];
    return {
      id: master.id,
      displayName: master.displayName,
      starts: starts.map((start) => start.toISOString()),
    };
  });

  const combined = new Map<string, { startAt: string; staffIds: string[] }>();
  for (const master of masters) {
    for (const startAt of master.starts) {
      const slot = combined.get(startAt) ?? { startAt, staffIds: [] };
      slot.staffIds.push(master.id);
      combined.set(startAt, slot);
    }
  }

  return {
    date,
    timezone: organization.timezone,
    service,
    constraints: {
      minimumLeadMinutes: organization.settings.minimumLeadMinutes,
      bookingHorizonDays: organization.settings.bookingHorizonDays,
      slotStepMinutes: organization.settings.slotStepMinutes,
      technicalBreakMinutes: organization.settings.technicalBreakMinutes,
    },
    withinOnlineWindow,
    masters,
    slots: [...combined.values()].sort((left, right) => left.startAt.localeCompare(right.startAt)),
  };
}

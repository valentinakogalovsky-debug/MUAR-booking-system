import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { calculateWorkingIntervals } from "@/lib/schedule/calculate";
import { addDays, studioDate, studioDateTimeToUtc } from "@/lib/schedule/time";
import { getDb } from "@/lib/db";
import { generateAvailableStarts } from "@/lib/availability/calculate";
import { bookingRequestHash, bookingRequestSchema, idempotencyKeySchema } from "./validation";

export type BookingErrorCode =
  "IDEMPOTENCY_CONFLICT" | "INVALID_INPUT" | "SERVICE_NOT_FOUND" | "SLOT_TAKEN" | "STAFF_NOT_FOUND";

export class BookingError extends Error {
  constructor(
    readonly code: BookingErrorCode,
    readonly status: 400 | 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

type BookingCreationContext = {
  actor: { userId: string; organizationId: string };
  source: "ADMIN";
};

function isDatabaseConflict(error: unknown) {
  const pending: unknown[] = [error];
  const visited = new Set<unknown>();
  while (pending.length > 0 && visited.size < 30) {
    const current = pending.shift();
    if (!current || typeof current !== "object" || visited.has(current)) continue;
    visited.add(current);
    const record = current as Record<string, unknown>;
    if (["23P01", "23505"].includes(String(record.code))) return true;
    pending.push(...Object.values(record));
  }
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (["P2002", "P2034"].includes(error.code) ||
      (error.code === "P2039" &&
        (error.message.includes("Booking_staff_time_no_overlap") ||
          error.message.includes("deadlock detected"))))
  );
}

async function previousIdempotentBooking(key: string, requestHash: string) {
  const record = await getDb().idempotencyKey.findUnique({
    where: { key },
    include: { booking: { include: bookingPublicInclude } },
  });
  if (!record) return null;
  if (record.requestHash !== requestHash) {
    throw new BookingError(
      "IDEMPOTENCY_CONFLICT",
      409,
      "Этот ключ уже использован для другого запроса",
    );
  }
  if (!record.booking) throw new BookingError("SLOT_TAKEN", 409, "Время уже занято");
  return publicBooking(record.booking);
}

const bookingPublicInclude = {
  staff: { select: { id: true, displayName: true } },
  services: {
    orderBy: { position: "asc" as const },
    select: {
      serviceId: true,
      nameSnapshot: true,
      durationMinutesSnapshot: true,
      priceMinorSnapshot: true,
    },
  },
} satisfies Prisma.BookingInclude;

type PublicBookingRecord = Prisma.BookingGetPayload<{ include: typeof bookingPublicInclude }>;

function publicBooking(booking: PublicBookingRecord) {
  return {
    id: booking.id,
    status: booking.status,
    staff: booking.staff,
    services: booking.services,
    startAt: booking.startAt.toISOString(),
    endAt: booking.endAt.toISOString(),
    occupiedUntil: booking.occupiedUntil.toISOString(),
    totalPriceMinor: booking.totalPriceMinor,
    currency: booking.currency,
    message: "Заявка отправлена. Администратор позвонит вам для подтверждения.",
  };
}

export async function createBookingRequest(
  input: unknown,
  rawIdempotencyKey: string | null,
  context?: BookingCreationContext,
) {
  const parsed = bookingRequestSchema.safeParse(input);
  const parsedKey = idempotencyKeySchema.safeParse(rawIdempotencyKey);
  if (!parsed.success || !parsedKey.success) {
    throw new BookingError("INVALID_INPUT", 400, "Проверьте данные заявки");
  }

  const value = parsed.data;
  const key = parsedKey.data;
  const requestHash = bookingRequestHash(value);
  const previous = await previousIdempotentBooking(key, requestHash);
  if (previous) return { booking: previous, created: false };

  try {
    const booking = await getDb().$transaction(
      async (tx) => {
        await tx.idempotencyKey.create({
          data: {
            key,
            userId: context?.actor.userId,
            requestHash,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        const organization = await tx.organization.findUnique({
          where: context ? { id: context.actor.organizationId } : { slug: "muare" },
          select: { id: true, timezone: true, settings: true },
        });
        if (!organization?.settings) {
          throw new BookingError("INVALID_INPUT", 400, "Настройки студии недоступны");
        }

        const service = await tx.service.findFirst({
          where: {
            id: value.serviceIds[0],
            organizationId: organization.id,
            isActive: true,
          },
        });
        if (!service) throw new BookingError("SERVICE_NOT_FOUND", 404, "Услуга не найдена");

        const date = studioDate(value.startAt, organization.timezone);
        const dayStart = studioDateTimeToUtc(date, 0, organization.timezone);
        const dayEnd = studioDateTimeToUtc(date, 1440, organization.timezone);
        const staff = await tx.staffProfile.findFirst({
          where: {
            id: value.staffId,
            organizationId: organization.id,
            isActive: true,
            services: { some: { serviceId: service.id } },
          },
          include: {
            schedules: true,
            exceptions: { where: { startAt: { lt: dayEnd }, endAt: { gt: dayStart } } },
            bookings: {
              where: {
                status: { in: ["PENDING", "CONFIRMED"] },
                startAt: { lt: dayEnd },
                occupiedUntil: { gt: dayStart },
              },
              select: { startAt: true, occupiedUntil: true },
            },
          },
        });
        if (!staff) throw new BookingError("STAFF_NOT_FOUND", 404, "Мастер не найден");

        const now = new Date();
        const today = studioDate(now, organization.timezone);
        const lastDate = addDays(today, organization.settings.bookingHorizonDays);
        const earliestStart = new Date(
          now.getTime() + organization.settings.minimumLeadMinutes * 60_000,
        );
        if (
          date < today ||
          date > lastDate ||
          value.startAt < dayStart ||
          value.startAt >= dayEnd
        ) {
          throw new BookingError("SLOT_TAKEN", 409, "Это время недоступно для онлайн-записи");
        }

        const availableStarts = generateAvailableStarts({
          workingIntervals: calculateWorkingIntervals(
            date,
            organization.timezone,
            staff.schedules,
            staff.exceptions,
          ),
          busyIntervals: staff.bookings,
          durationMinutes: service.durationMinutes,
          technicalBreakMinutes: organization.settings.technicalBreakMinutes,
          slotStepMinutes: organization.settings.slotStepMinutes,
          earliestStart,
        });
        if (!availableStarts.some((start) => start.getTime() === value.startAt.getTime())) {
          throw new BookingError("SLOT_TAKEN", 409, "Выбранное время уже недоступно");
        }

        const endAt = new Date(value.startAt.getTime() + service.durationMinutes * 60_000);
        const occupiedUntil = new Date(
          endAt.getTime() + organization.settings.technicalBreakMinutes * 60_000,
        );
        const customer = await tx.customerProfile.upsert({
          where: {
            organizationId_phone: {
              organizationId: organization.id,
              phone: value.customer.phone,
            },
          },
          update: { firstName: value.customer.firstName, lastName: value.customer.lastName },
          create: { organizationId: organization.id, ...value.customer },
        });
        const created = await tx.booking.create({
          data: {
            organizationId: organization.id,
            customerId: customer.id,
            staffId: staff.id,
            startAt: value.startAt,
            endAt,
            occupiedUntil,
            createdById: context?.actor.userId,
            status: context ? "CONFIRMED" : "PENDING",
            source: context?.source ?? "CUSTOMER",
            totalPriceMinor: service.priceMinor,
            currency: service.currency,
            services: {
              create: {
                serviceId: service.id,
                position: 1,
                nameSnapshot: service.name,
                durationMinutesSnapshot: service.durationMinutes,
                priceMinorSnapshot: service.priceMinor,
              },
            },
          },
          include: bookingPublicInclude,
        });
        await tx.bookingHistory.create({
          data: {
            bookingId: created.id,
            changedById: context?.actor.userId,
            action: context ? "CREATED" : "REQUESTED",
            newData: {
              status: context ? "CONFIRMED" : "PENDING",
              source: context?.source ?? "CUSTOMER",
            },
          },
        });
        await tx.auditLog.create({
          data: {
            organizationId: organization.id,
            userId: context?.actor.userId,
            action: context ? "BOOKING_CREATED" : "BOOKING_REQUESTED",
            entityType: "BOOKING",
            entityId: created.id,
            metadata: { staffId: staff.id, serviceId: service.id, startAt: value.startAt },
          },
        });
        await tx.idempotencyKey.update({ where: { key }, data: { bookingId: created.id } });
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return { booking: publicBooking(booking), created: true };
  } catch (error) {
    if (error instanceof BookingError) throw error;
    if (isDatabaseConflict(error)) {
      const repeated = await previousIdempotentBooking(key, requestHash);
      if (repeated) return { booking: repeated, created: false };
      throw new BookingError("SLOT_TAKEN", 409, "Выбранное время уже занято");
    }
    throw error;
  }
}

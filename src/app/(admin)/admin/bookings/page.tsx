import Link from "next/link";
import { Role } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Field } from "@/components/ui/field";
import { requireRole } from "@/lib/auth/permissions";
import { listBookingRequests } from "@/lib/booking/admin";
import { cancelBookingAction, confirmBookingAction } from "../actions";

const statusNames = {
  PENDING: "Новые заявки",
  CONFIRMED: "Подтверждённые",
  CANCELLED: "Отменённые",
} as const;

function bookingDate(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Moscow",
  }).format(value);
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; success?: string; error?: string }>;
}) {
  const session = await requireRole(Role.ADMIN);
  const query = await searchParams;
  const status = query.status && query.status in statusNames ? query.status : "PENDING";
  const bookings = await listBookingRequests(session.user.organizationId, status);

  return (
    <main>
      <Container className="py-12 sm:py-16">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Работа с клиентами</p>
        <h1 className="mt-4 font-serif text-5xl font-light">Заявки и записи</h1>
        <nav aria-label="Статусы записей" className="mt-7 flex flex-wrap gap-3">
          {Object.entries(statusNames).map(([value, label]) => (
            <Link
              className={`border px-4 py-3 text-sm ${status === value ? "border-accent bg-accent text-white" : "border-line bg-surface"}`}
              href={`/admin/bookings?status=${value}`}
              key={value}
            >
              {label}
            </Link>
          ))}
        </nav>
        {query.success || query.error ? (
          <p
            className={`mt-6 border p-4 text-sm ${query.error ? "border-red-300 text-red-700" : "border-pistachio"}`}
            role="status"
          >
            {query.error ?? query.success}
          </p>
        ) : null}
        <div className="mt-8 space-y-4">
          {bookings.map((booking) => (
            <article className="border border-line bg-surface p-5 sm:p-6" key={booking.id}>
              <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_auto] lg:items-start">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-accent">
                    {booking.status}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </h2>
                  <a
                    className="mt-2 inline-block text-lg underline"
                    href={`tel:${booking.customer.phone}`}
                  >
                    {booking.customer.phone}
                  </a>
                </div>
                <div className="text-sm leading-7">
                  <p>{booking.services.map((item) => item.nameSnapshot).join(", ")}</p>
                  <p className="text-muted">{booking.staff.displayName}</p>
                  <p className="text-muted">{bookingDate(booking.startAt)}</p>
                </div>
                {booking.status === "PENDING" ? (
                  <form action={confirmBookingAction}>
                    <input name="id" type="hidden" value={booking.id} />
                    <Button className="w-full" type="submit">
                      Подтвердить
                    </Button>
                  </form>
                ) : null}
              </div>
              {booking.status === "PENDING" || booking.status === "CONFIRMED" ? (
                <form
                  action={cancelBookingAction}
                  className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-[1fr_auto]"
                >
                  <input name="id" type="hidden" value={booking.id} />
                  <input name="returnStatus" type="hidden" value={status} />
                  <Field label="Причина отмены" minLength={2} name="reason" required />
                  <div className="flex items-end">
                    <Button className="w-full" type="submit" variant="ghost">
                      Отменить
                    </Button>
                  </div>
                </form>
              ) : null}
            </article>
          ))}
          {bookings.length === 0 ? (
            <p className="border border-line bg-surface p-8 text-center text-muted">
              В этом разделе записей пока нет.
            </p>
          ) : null}
        </div>
      </Container>
    </main>
  );
}

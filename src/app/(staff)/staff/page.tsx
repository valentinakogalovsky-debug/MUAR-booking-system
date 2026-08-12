import Link from "next/link";
import { Role } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { requireRole } from "@/lib/auth/permissions";
import { listStaffBookings } from "@/lib/booking/staff";
import { addDays, parseDate, studioDate } from "@/lib/schedule/time";
import { setBookingStatusAction } from "./actions";

const statusNames: Record<string, string> = {
  PENDING: "Ожидает подтверждения",
  CONFIRMED: "Подтверждена",
  COMPLETED: "Выполнена",
  NO_SHOW: "Клиент не пришёл",
};

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; success?: string; error?: string }>;
}) {
  const session = await requireRole(Role.STAFF);
  if (!session.user.staffProfileId) return null;
  const query = await searchParams;
  const today = studioDate(new Date(), "Europe/Moscow");
  let date = today;
  try {
    date = parseDate(query.date || today);
  } catch {}
  const view = query.view === "week" ? "week" : "today";
  const data = await listStaffBookings(
    {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      staffProfileId: session.user.staffProfileId,
    },
    date,
    view === "week" ? 7 : 1,
  );

  return (
    <main>
      <Container className="py-12 sm:py-16">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Личное расписание</p>
        <h1 className="mt-4 font-serif text-5xl font-light">Кабинет мастера</h1>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            className={`border px-4 py-3 ${view === "today" ? "border-accent bg-accent text-white" : "border-line bg-surface"}`}
            href={`/staff?view=today&date=${today}`}
          >
            Сегодня
          </Link>
          <Link
            className={`border px-4 py-3 ${view === "week" ? "border-accent bg-accent text-white" : "border-line bg-surface"}`}
            href={`/staff?view=week&date=${today}`}
          >
            Неделя
          </Link>
          {view === "week" ? (
            <>
              <Link
                className="border border-line bg-surface px-4 py-3"
                href={`/staff?view=week&date=${addDays(date, -7)}`}
              >
                ←
              </Link>
              <Link
                className="border border-line bg-surface px-4 py-3"
                href={`/staff?view=week&date=${addDays(date, 7)}`}
              >
                →
              </Link>
            </>
          ) : null}
        </div>
        {query.success || query.error ? (
          <p
            className={`mt-6 border p-4 text-sm ${query.error ? "border-red-300 text-red-700" : "border-pistachio"}`}
            role="status"
          >
            {query.error ?? query.success}
          </p>
        ) : null}
        <p className="mt-6 text-sm text-muted">
          Период: {date.split("-").reverse().join(".")}
          {view === "week" ? ` — ${addDays(date, 6).split("-").reverse().join(".")}` : ""}
        </p>
        <div className="mt-8 space-y-4">
          {data.bookings.map((booking) => (
            <article className="border border-line bg-surface p-5 sm:p-6" key={booking.id}>
              <div className="grid gap-5 md:grid-cols-[1fr_1fr_auto] md:items-start">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-accent">
                    {statusNames[booking.status] ?? booking.status}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </h2>
                  <a className="mt-2 inline-block underline" href={`tel:${booking.customer.phone}`}>
                    {booking.customer.phone}
                  </a>
                </div>
                <div className="text-sm leading-7">
                  <p>{booking.services.map((item) => item.nameSnapshot).join(", ")}</p>
                  <p className="text-muted">
                    {new Intl.DateTimeFormat("ru-RU", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: data.timezone,
                    }).format(booking.startAt)}
                  </p>
                </div>
                {booking.status === "CONFIRMED" ? (
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {[
                      ["COMPLETED", "Выполнено"],
                      ["NO_SHOW", "Неявка"],
                    ].map(([status, label]) => (
                      <form action={setBookingStatusAction} key={status}>
                        <input name="id" type="hidden" value={booking.id} />
                        <input name="status" type="hidden" value={status} />
                        <input name="view" type="hidden" value={view} />
                        <input name="date" type="hidden" value={date} />
                        <Button
                          type="submit"
                          variant={status === "COMPLETED" ? "primary" : "ghost"}
                        >
                          {label}
                        </Button>
                      </form>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
          {data.bookings.length === 0 ? (
            <p className="border border-line bg-surface p-8 text-center text-muted">
              На выбранный период записей нет.
            </p>
          ) : null}
        </div>
      </Container>
    </main>
  );
}

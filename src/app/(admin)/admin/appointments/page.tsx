import Link from "next/link";
import { Role } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { requireRole } from "@/lib/auth/permissions";
import { listAdminSchedule } from "@/lib/booking/admin";
import { addDays, parseDate, studioDate } from "@/lib/schedule/time";
import { cancelBookingAction } from "../actions";

const statusNames = {
  "": "Все статусы",
  PENDING: "Ожидает",
  CONFIRMED: "Подтверждена",
  COMPLETED: "Выполнена",
  CANCELLED: "Отменена",
  NO_SHOW: "Неявка",
} as const;

const selectClass = "mt-2 min-h-12 w-full rounded-[2px] border border-line bg-surface px-4 py-3";

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    view?: string;
    staffId?: string;
    status?: string;
    success?: string;
    error?: string;
  }>;
}) {
  const session = await requireRole(Role.ADMIN);
  const query = await searchParams;
  const today = studioDate(new Date(), "Europe/Moscow");
  let date = today;
  try {
    date = parseDate(query.date || today);
  } catch {}
  const view = query.view === "week" ? "week" : "day";
  const status = query.status && query.status in statusNames ? query.status : "";
  const data = await listAdminSchedule(session.user.organizationId, {
    date,
    days: view === "week" ? 7 : 1,
    staffId: query.staffId || undefined,
    status: status || undefined,
  });
  const currentQuery = new URLSearchParams({ date, view });
  if (query.staffId) currentQuery.set("staffId", query.staffId);
  if (status) currentQuery.set("status", status);

  return (
    <main>
      <Container className="py-12 sm:py-16">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Рабочий календарь</p>
        <h1 className="mt-4 font-serif text-5xl font-light">Общее расписание</h1>
        <Link
          className="mt-6 inline-flex min-h-12 items-center border border-accent bg-accent px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-white"
          href="/admin/appointments/new"
        >
          Создать запись
        </Link>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            className={`border px-4 py-3 ${view === "day" ? "border-accent bg-accent text-white" : "border-line bg-surface"}`}
            href={`/admin/appointments?view=day&date=${today}`}
          >
            Сегодня
          </Link>
          <Link
            className={`border px-4 py-3 ${view === "week" ? "border-accent bg-accent text-white" : "border-line bg-surface"}`}
            href={`/admin/appointments?view=week&date=${today}`}
          >
            Неделя
          </Link>
          <Link
            aria-label="Предыдущий период"
            className="border border-line bg-surface px-4 py-3"
            href={`/admin/appointments?${new URLSearchParams({ ...Object.fromEntries(currentQuery), date: addDays(date, view === "week" ? -7 : -1) })}`}
          >
            ←
          </Link>
          <Link
            aria-label="Следующий период"
            className="border border-line bg-surface px-4 py-3"
            href={`/admin/appointments?${new URLSearchParams({ ...Object.fromEntries(currentQuery), date: addDays(date, view === "week" ? 7 : 1) })}`}
          >
            →
          </Link>
        </div>

        <form className="mt-7 grid gap-4 border border-line bg-surface p-5 sm:grid-cols-3">
          <input name="view" type="hidden" value={view} />
          <label className="text-xs text-muted">
            Дата
            <input className={selectClass} defaultValue={date} name="date" type="date" />
          </label>
          <label className="text-xs text-muted">
            Мастер
            <select className={selectClass} defaultValue={query.staffId || ""} name="staffId">
              <option value="">Все мастера</option>
              {data.staff.map((master) => (
                <option key={master.id} value={master.id}>
                  {master.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            Статус
            <select className={selectClass} defaultValue={status} name="status">
              {Object.entries(statusNames).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-3">
            <Button type="submit">Показать</Button>
          </div>
        </form>

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
              <div className="grid gap-5 md:grid-cols-[1fr_1fr_auto]">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-accent">
                    {statusNames[booking.status]}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl">{booking.staff.displayName}</h2>
                  <p className="mt-2">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </p>
                  <a className="underline" href={`tel:${booking.customer.phone}`}>
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
                <p className="text-sm font-medium">
                  {new Intl.NumberFormat("ru-RU", {
                    style: "currency",
                    currency: booking.currency,
                    maximumFractionDigits: 0,
                  }).format(booking.totalPriceMinor / 100)}
                </p>
                {booking.status === "PENDING" || booking.status === "CONFIRMED" ? (
                  <Link
                    className="text-sm text-accent underline"
                    href={`/admin/appointments/${booking.id}/reschedule`}
                  >
                    Перенести
                  </Link>
                ) : null}
              </div>
              {booking.status === "PENDING" || booking.status === "CONFIRMED" ? (
                <form
                  action={cancelBookingAction}
                  className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-[1fr_auto]"
                >
                  <input name="id" type="hidden" value={booking.id} />
                  <input name="returnStatus" type="hidden" value={booking.status} />
                  <input
                    name="returnPath"
                    type="hidden"
                    value={`/admin/appointments?${currentQuery.toString()}`}
                  />
                  <label className="text-xs text-muted">
                    Причина отмены
                    <input className={selectClass} minLength={2} name="reason" required />
                  </label>
                  <div className="flex items-end">
                    <Button type="submit" variant="ghost">
                      Отменить
                    </Button>
                  </div>
                </form>
              ) : null}
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

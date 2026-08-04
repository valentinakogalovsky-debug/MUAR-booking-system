import { Role } from "@/generated/prisma/client";
import { ScheduleDateFilter } from "@/components/admin/schedule-date-filter";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Field } from "@/components/ui/field";
import { getScheduleOverview, listUpcomingExceptions } from "@/lib/admin/schedule";
import { requireRole } from "@/lib/auth/permissions";
import { formatStudioTime, parseDate, studioDate } from "@/lib/schedule/time";
import { createExceptionAction, removeExceptionAction } from "../actions";

const categoryNames: Record<string, string> = {
  VACATION: "Отпуск",
  SICK_LEAVE: "Больничный",
  DAY_OFF: "Выходной",
  EXTRA_SHIFT: "Дополнительная смена",
  SHORT_SHIFT: "Сокращённая смена",
  BLOCK: "Блокировка времени",
};

const fieldClass =
  "mt-2 min-h-12 w-full rounded-[2px] border border-line bg-surface px-4 py-3 outline-none focus:border-accent";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; success?: string; error?: string }>;
}) {
  const session = await requireRole(Role.ADMIN);
  const query = await searchParams;
  const today = studioDate(new Date(), "Europe/Moscow");
  let selectedDate = today;
  try {
    selectedDate = parseDate(query.date || today);
  } catch {}

  const [overview, exceptions] = await Promise.all([
    getScheduleOverview(session.user.organizationId, selectedDate),
    listUpcomingExceptions(session.user.organizationId, today),
  ]);

  return (
    <main>
      <Container className="py-12 sm:py-16">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Расписание команды</p>
        <h1 className="mt-4 font-serif text-5xl font-light">Графики и исключения</h1>
        {query.success || query.error ? (
          <p
            className={`mt-6 border p-4 text-sm ${query.error ? "border-red-300 text-red-700" : "border-pistachio"}`}
            role="status"
          >
            {query.error ?? query.success}
          </p>
        ) : null}

        <ScheduleDateFilter key={selectedDate} selectedDate={selectedDate} />

        <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {overview.staff.map((master) => (
            <article className="border border-line bg-surface p-5" key={master.id}>
              <h2 className="font-serif text-2xl">{master.displayName}</h2>
              <p className="mt-3 text-sm text-muted">
                {master.intervals.length
                  ? master.intervals
                      .map(
                        (interval) =>
                          `${formatStudioTime(interval.startAt, overview.timezone)}–${formatStudioTime(interval.endAt, overview.timezone)}`,
                      )
                      .join(", ")
                  : "Не работает"}
              </p>
              {master.exceptions.length ? (
                <p className="mt-3 text-xs text-accent">Есть изменение регулярного графика</p>
              ) : null}
            </article>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="font-serif text-4xl">Добавить изменение</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Дополнительная или сокращённая смена заменяет регулярные часы выбранного дня. Блокировка
            убирает только указанный интервал.
          </p>
          <form
            action={createExceptionAction}
            className="mt-6 grid gap-4 border border-line bg-surface p-6 md:grid-cols-2 xl:grid-cols-4"
          >
            <label className="text-xs text-muted">
              Мастер
              <select className={fieldClass} name="staffId" required>
                {overview.staff.map((master) => (
                  <option key={master.id} value={master.id}>
                    {master.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted">
              Причина
              <select className={fieldClass} name="category" required>
                {Object.entries(categoryNames).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <Field
              defaultValue={selectedDate}
              label="Дата начала"
              name="dateFrom"
              required
              type="date"
            />
            <Field
              defaultValue={selectedDate}
              label="Дата окончания"
              name="dateTo"
              required
              type="date"
            />
            <Field defaultValue="09:00" label="Начало времени" name="startTime" type="time" />
            <Field defaultValue="20:00" label="Окончание времени" name="endTime" type="time" />
            <Field className="xl:col-span-2" label="Комментарий" name="note" />
            <div className="md:col-span-2 xl:col-span-4">
              <Button type="submit">Добавить в график</Button>
            </div>
          </form>
        </section>

        <section className="mt-16">
          <h2 className="font-serif text-4xl">Предстоящие изменения</h2>
          <div className="mt-6 space-y-3">
            {exceptions.map((exception) => {
              const category = exception.reason?.split(":", 1)[0] || "BLOCK";
              return (
                <article
                  className="flex flex-wrap items-center justify-between gap-4 border border-line bg-surface p-5"
                  key={exception.id}
                >
                  <div>
                    <h3 className="font-medium">
                      {exception.staff.displayName} · {categoryNames[category] ?? "Изменение"}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {new Intl.DateTimeFormat("ru-RU", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: overview.timezone,
                      }).format(exception.startAt)}{" "}
                      —{" "}
                      {new Intl.DateTimeFormat("ru-RU", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: overview.timezone,
                      }).format(exception.endAt)}
                    </p>
                  </div>
                  <form action={removeExceptionAction}>
                    <input name="id" type="hidden" value={exception.id} />
                    <input name="date" type="hidden" value={selectedDate} />
                    <Button type="submit" variant="ghost">
                      Удалить
                    </Button>
                  </form>
                </article>
              );
            })}
            {exceptions.length === 0 ? (
              <p className="border border-line p-6 text-muted">Предстоящих изменений нет.</p>
            ) : null}
          </div>
        </section>
      </Container>
    </main>
  );
}

import { Role } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Field } from "@/components/ui/field";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import { getAdminBookingForReschedule } from "@/lib/booking/admin";
import { studioDate } from "@/lib/schedule/time";
import { rescheduleBookingAction } from "../../../actions";

const selectClass = "mt-2 min-h-12 w-full rounded-[2px] border border-line bg-surface px-4 py-3";

export default async function ReschedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireRole(Role.ADMIN);
  const { id } = await params;
  const booking = await getAdminBookingForReschedule(session.user.organizationId, id);
  const serviceId = booking.services[0]?.serviceId;
  const [staff, notice] = await Promise.all([
    getDb().staffProfile.findMany({
      where: {
        organizationId: session.user.organizationId,
        isActive: true,
        ...(serviceId ? { services: { some: { serviceId } } } : {}),
      },
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true },
    }),
    searchParams,
  ]);
  const date = studioDate(booking.startAt, "Europe/Moscow");
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(booking.startAt);

  return (
    <main>
      <Container className="py-12 sm:py-16">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Изменение записи</p>
        <h1 className="mt-4 font-serif text-5xl font-light">Перенести запись</h1>
        <p className="mt-5 text-foreground/70">
          {booking.customer.firstName} {booking.customer.lastName} ·{" "}
          {booking.services.map((item) => item.nameSnapshot).join(", ")}
        </p>
        {notice.success || notice.error ? (
          <p
            className={`mt-6 border p-4 text-sm ${notice.error ? "border-red-300 text-red-700" : "border-pistachio"}`}
            role="status"
          >
            {notice.error ?? notice.success}
          </p>
        ) : null}
        <form
          action={rescheduleBookingAction}
          className="mt-8 grid max-w-3xl gap-5 border border-line bg-surface p-6 sm:grid-cols-3 sm:p-8"
        >
          <input name="id" type="hidden" value={booking.id} />
          <label className="text-xs text-muted">
            Мастер
            <select className={selectClass} defaultValue={booking.staffId} name="staffId" required>
              {staff.map((master) => (
                <option key={master.id} value={master.id}>
                  {master.displayName}
                </option>
              ))}
            </select>
          </label>
          <Field defaultValue={date} label="Новая дата" name="date" required type="date" />
          <Field defaultValue={time} label="Новое время" name="time" required type="time" />
          <p className="text-sm leading-6 text-muted sm:col-span-3">
            Сервер проверит график, длительность услуги, технический перерыв и другие записи. При
            конфликте прежнее время сохранится.
          </p>
          <div className="sm:col-span-3">
            <Button type="submit">Проверить и перенести</Button>
          </div>
        </form>
      </Container>
    </main>
  );
}

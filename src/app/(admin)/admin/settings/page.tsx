import { Role } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Field } from "@/components/ui/field";
import { getSettings } from "@/lib/admin/settings";
import { requireRole } from "@/lib/auth/permissions";
import { updateSettingsAction } from "../actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireRole(Role.ADMIN);
  const settings = await getSettings(session.user.organizationId);
  const notice = await searchParams;

  return (
    <main>
      <Container className="py-12 sm:py-16">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Онлайн-запись</p>
        <h1 className="mt-4 font-serif text-5xl font-light">Настройки записи</h1>
        <p className="mt-5 max-w-2xl leading-7 text-foreground/70">
          Эти значения определяют, насколько заранее клиент может отправить заявку и как далеко
          вперёд показывается расписание.
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
          action={updateSettingsAction}
          className="mt-10 grid max-w-2xl gap-6 border border-line bg-surface p-6 sm:grid-cols-2 sm:p-8"
        >
          <Field
            defaultValue={settings.minimumLeadMinutes}
            hint="Например, 120 минут — запись минимум за 2 часа."
            label="Минимум до визита, минут"
            min="0"
            name="minimumLeadMinutes"
            required
            type="number"
          />
          <Field
            defaultValue={settings.bookingHorizonDays}
            hint="Например, 60 дней вперёд."
            label="Горизонт записи, дней"
            min="1"
            name="bookingHorizonDays"
            required
            type="number"
          />
          <div className="sm:col-span-2">
            <Button type="submit">Сохранить настройки</Button>
          </div>
        </form>
        <dl className="mt-8 grid max-w-2xl gap-4 text-sm sm:grid-cols-2">
          <div className="border border-line p-4">
            <dt className="text-muted">Шаг начала</dt>
            <dd className="mt-1 text-lg">{settings.slotStepMinutes} минут</dd>
          </div>
          <div className="border border-line p-4">
            <dt className="text-muted">Технический перерыв</dt>
            <dd className="mt-1 text-lg">{settings.technicalBreakMinutes} минут</dd>
          </div>
        </dl>
      </Container>
    </main>
  );
}

import { Role } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Field } from "@/components/ui/field";
import { listStaff } from "@/lib/admin/staff";
import { requireRole } from "@/lib/auth/permissions";
import { updateStaffAction } from "../actions";

export default async function StaffManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireRole(Role.ADMIN);
  const staff = await listStaff(session.user.organizationId);
  const notice = await searchParams;

  return (
    <main>
      <Container className="py-12 sm:py-16">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Команда</p>
        <h1 className="mt-4 font-serif text-5xl font-light">Мастера</h1>
        <p className="mt-5 text-foreground/70">
          В системе {staff.length} мастеров. Активному мастеру доступен весь каталог услуг.
        </p>
        {notice.success || notice.error ? (
          <p
            className={`mt-6 border p-4 text-sm ${notice.error ? "border-red-300 text-red-700" : "border-pistachio"}`}
            role="status"
          >
            {notice.error ?? notice.success}
          </p>
        ) : null}
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {staff.map((master) => (
            <article
              className={`border p-6 ${master.isActive ? "border-line bg-surface" : "border-line opacity-70"}`}
              key={master.id}
            >
              <form action={updateStaffAction} className="space-y-5">
                <input name="id" type="hidden" value={master.id} />
                <Field
                  defaultValue={master.displayName}
                  label="Имя мастера"
                  name="displayName"
                  required
                />
                <label className="block text-xs text-muted">
                  Статус
                  <select
                    className="mt-2 min-h-12 w-full border border-line bg-surface px-4"
                    defaultValue={String(master.isActive)}
                    name="isActive"
                  >
                    <option value="true">Работает</option>
                    <option value="false">Неактивен</option>
                  </select>
                </label>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span className="text-sm text-muted">
                    {master.user.phone} · услуг: {master.services.length}
                  </span>
                  <Button type="submit">Сохранить</Button>
                </div>
              </form>
            </article>
          ))}
        </div>
      </Container>
    </main>
  );
}

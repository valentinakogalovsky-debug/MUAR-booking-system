import { Role } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Field } from "@/components/ui/field";
import { listCatalog } from "@/lib/admin/catalog";
import { requireRole } from "@/lib/auth/permissions";
import {
  createAddonAction,
  createServiceAction,
  removeAddonAction,
  removeServiceAction,
  toggleAddonAction,
  toggleServiceAction,
  updateAddonAction,
  updateServiceAction,
} from "../actions";

const selectClass =
  "min-h-12 w-full rounded-[2px] border border-line bg-surface px-4 py-3 outline-none focus:border-accent";

function Notice({ success, error }: { success?: string; error?: string }) {
  if (!success && !error) return null;
  return (
    <p
      className={`mt-6 border p-4 text-sm ${error ? "border-red-300 text-red-700" : "border-pistachio"}`}
      role="status"
    >
      {error ?? success}
    </p>
  );
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireRole(Role.ADMIN);
  const { services, addons } = await listCatalog(session.user.organizationId);
  const notice = await searchParams;

  return (
    <main>
      <Container className="py-12 sm:py-16">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Каталог</p>
        <h1 className="mt-4 font-serif text-5xl font-light">Услуги и дополнения</h1>
        <Notice {...notice} />

        <section className="mt-12">
          <h2 className="font-serif text-4xl">Основные услуги</h2>
          <div className="mt-6 space-y-5">
            {services.map((service) => (
              <article
                className={`border p-5 ${service.isActive ? "border-line bg-surface" : "border-line bg-background opacity-70"}`}
                key={service.id}
              >
                <form action={updateServiceAction} className="grid gap-4 lg:grid-cols-5">
                  <input name="id" type="hidden" value={service.id} />
                  <Field defaultValue={service.name} label="Название" name="name" required />
                  <label className="text-xs text-muted">
                    Категория
                    <select
                      className={`${selectClass} mt-2`}
                      defaultValue={service.category}
                      name="category"
                    >
                      <option value="MANICURE">Маникюр</option>
                      <option value="PEDICURE">Педикюр</option>
                    </select>
                  </label>
                  <Field
                    defaultValue={service.durationMinutes}
                    label="Минуты"
                    min="15"
                    name="durationMinutes"
                    required
                    type="number"
                  />
                  <Field
                    defaultValue={service.priceMinor / 100}
                    label="Цена, ₽"
                    min="0"
                    name="priceRubles"
                    required
                    type="number"
                  />
                  <div className="flex items-end">
                    <Button className="w-full" type="submit">
                      Сохранить
                    </Button>
                  </div>
                </form>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
                  <span>
                    Мастеров: {service._count.staff} · Записей: {service._count.bookingItems}
                  </span>
                  <div className="flex gap-2">
                    <form action={toggleServiceAction}>
                      <input name="id" type="hidden" value={service.id} />
                      <input name="isActive" type="hidden" value={String(!service.isActive)} />
                      <Button type="submit" variant="ghost">
                        {service.isActive ? "Отключить" : "Включить"}
                      </Button>
                    </form>
                    <form action={removeServiceAction}>
                      <input name="id" type="hidden" value={service.id} />
                      <Button type="submit" variant="ghost">
                        Удалить
                      </Button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <form
            action={createServiceAction}
            className="mt-6 grid gap-4 border border-dashed border-accent p-5 lg:grid-cols-5"
          >
            <Field label="Новая услуга" name="name" required />
            <label className="text-xs text-muted">
              Категория
              <select className={`${selectClass} mt-2`} name="category">
                <option value="MANICURE">Маникюр</option>
                <option value="PEDICURE">Педикюр</option>
              </select>
            </label>
            <Field label="Минуты" min="15" name="durationMinutes" required type="number" />
            <Field label="Цена, ₽" min="0" name="priceRubles" required type="number" />
            <div className="flex items-end">
              <Button className="w-full" type="submit">
                Добавить
              </Button>
            </div>
          </form>
        </section>

        <section className="mt-16">
          <h2 className="font-serif text-4xl">Ценовые дополнения</h2>
          <div className="mt-6 space-y-4">
            {addons.map((addon) => {
              const priceType = addon.isIncluded
                ? "INCLUDED"
                : addon.minimumPriceMinor !== null
                  ? "FROM"
                  : "FIXED";
              const price = (addon.minimumPriceMinor ?? addon.priceMinor ?? 0) / 100;
              return (
                <article
                  className={`border p-5 ${addon.isActive ? "border-line bg-surface" : "border-line opacity-70"}`}
                  key={addon.id}
                >
                  <form action={updateAddonAction} className="grid gap-4 lg:grid-cols-4">
                    <input name="id" type="hidden" value={addon.id} />
                    <Field defaultValue={addon.name} label="Название" name="name" required />
                    <label className="text-xs text-muted">
                      Тип цены
                      <select
                        className={`${selectClass} mt-2`}
                        defaultValue={priceType}
                        name="priceType"
                      >
                        <option value="INCLUDED">Включено</option>
                        <option value="FIXED">Точная цена</option>
                        <option value="FROM">Цена от</option>
                      </select>
                    </label>
                    <Field
                      defaultValue={price}
                      label="Цена, ₽"
                      min="0"
                      name="priceRubles"
                      type="number"
                    />
                    <div className="flex items-end">
                      <Button className="w-full" type="submit">
                        Сохранить
                      </Button>
                    </div>
                  </form>
                  <div className="mt-4 flex justify-end gap-2">
                    <form action={toggleAddonAction}>
                      <input name="id" type="hidden" value={addon.id} />
                      <input name="isActive" type="hidden" value={String(!addon.isActive)} />
                      <Button type="submit" variant="ghost">
                        {addon.isActive ? "Отключить" : "Включить"}
                      </Button>
                    </form>
                    <form action={removeAddonAction}>
                      <input name="id" type="hidden" value={addon.id} />
                      <Button type="submit" variant="ghost">
                        Удалить
                      </Button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
          <form
            action={createAddonAction}
            className="mt-6 grid gap-4 border border-dashed border-accent p-5 lg:grid-cols-4"
          >
            <Field label="Новое дополнение" name="name" required />
            <label className="text-xs text-muted">
              Тип цены
              <select className={`${selectClass} mt-2`} name="priceType">
                <option value="INCLUDED">Включено</option>
                <option value="FIXED">Точная цена</option>
                <option value="FROM">Цена от</option>
              </select>
            </label>
            <Field label="Цена, ₽" min="0" name="priceRubles" type="number" />
            <div className="flex items-end">
              <Button className="w-full" type="submit">
                Добавить
              </Button>
            </div>
          </form>
        </section>
      </Container>
    </main>
  );
}

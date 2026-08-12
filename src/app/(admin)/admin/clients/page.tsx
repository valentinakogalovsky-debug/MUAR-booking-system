import { Role } from "@/generated/prisma/client";
import { Container } from "@/components/ui/container";
import { requireRole } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";

export default async function AdminClientsPage() {
  const session = await requireRole(Role.ADMIN);
  const clients = await getDb().customerProfile.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 200,
    include: {
      bookings: {
        orderBy: { startAt: "desc" },
        take: 3,
        include: {
          staff: { select: { displayName: true } },
          services: { orderBy: { position: "asc" } },
        },
      },
    },
  });

  return (
    <main>
      <Container className="py-12 sm:py-16">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Клиентская база</p>
        <h1 className="mt-4 font-serif text-5xl font-light">Клиенты</h1>
        <p className="mt-5 max-w-3xl text-foreground/70">
          Контакты и три последние записи. Клиенты не имеют аккаунтов и личных кабинетов.
        </p>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {clients.map((client) => (
            <article className="border border-line bg-surface p-5 sm:p-6" key={client.id}>
              <h2 className="font-serif text-3xl">
                {client.firstName} {client.lastName}
              </h2>
              <a className="mt-2 inline-block text-lg underline" href={`tel:${client.phone}`}>
                {client.phone}
              </a>
              <h3 className="mt-6 text-xs uppercase tracking-[0.14em] text-muted">
                Последние записи
              </h3>
              <div className="mt-3 space-y-3">
                {client.bookings.map((booking) => (
                  <div className="border-t border-line pt-3 text-sm" key={booking.id}>
                    <p>{booking.services.map((item) => item.nameSnapshot).join(", ")}</p>
                    <p className="mt-1 text-muted">
                      {new Intl.DateTimeFormat("ru-RU", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Europe/Moscow",
                      }).format(booking.startAt)}{" "}
                      · {booking.staff.displayName} · {booking.status}
                    </p>
                  </div>
                ))}
                {client.bookings.length === 0 ? (
                  <p className="text-sm text-muted">Записей пока нет.</p>
                ) : null}
              </div>
            </article>
          ))}
          {clients.length === 0 ? (
            <p className="border border-line bg-surface p-8 text-center text-muted lg:col-span-2">
              Клиентов пока нет.
            </p>
          ) : null}
        </div>
      </Container>
    </main>
  );
}

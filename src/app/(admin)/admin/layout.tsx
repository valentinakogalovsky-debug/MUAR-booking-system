import Link from "next/link";
import { Role } from "@/generated/prisma/client";
import { requireRole } from "@/lib/auth/permissions";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const links = [
  ["Обзор", "/admin"],
  ["Заявки", "/admin/bookings"],
  ["Расписание", "/admin/appointments"],
  ["Клиенты", "/admin/clients"],
  ["Услуги", "/admin/catalog"],
  ["Мастера", "/admin/staff"],
  ["Графики", "/admin/schedule"],
  ["Настройки", "/admin/settings"],
  ["Журнал", "/admin/audit"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(Role.ADMIN);
  return (
    <>
      <header className="border-b border-line bg-surface">
        <Container className="flex flex-wrap items-center justify-between gap-5 py-5">
          <Link className="font-serif text-3xl" href="/admin">
            MUARÉ · Администратор
          </Link>
          <nav aria-label="Административная навигация" className="flex flex-wrap gap-4 text-sm">
            {links.map(([label, href]) => (
              <Link
                className="inline-flex min-h-11 items-center hover:text-accent focus-visible:outline-2"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/sign-in" });
            }}
          >
            <Button type="submit" variant="ghost">
              Выйти
            </Button>
          </form>
        </Container>
      </header>
      {children}
    </>
  );
}

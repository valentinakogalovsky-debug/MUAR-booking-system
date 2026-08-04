import Link from "next/link";
import { Container } from "@/components/ui/container";

export default async function AdminPage() {
  const sections = [
    ["Услуги и дополнения", "Редактирование каталога, цен и длительности", "/admin/catalog"],
    ["Мастера", "Пять профилей и доступность услуг", "/admin/staff"],
    ["Настройки записи", "Минимальное время и горизонт онлайн-записи", "/admin/settings"],
    ["Журнал изменений", "История важных действий администратора", "/admin/audit"],
  ] as const;
  return (
    <main>
      <Container className="py-12 sm:py-16">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Управление студией</p>
        <h1 className="mt-4 font-serif text-5xl font-light sm:text-7xl">Панель администратора</h1>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {sections.map(([title, description, href]) => (
            <Link
              className="border border-line bg-surface p-7 transition hover:border-accent"
              href={href}
              key={href}
            >
              <h2 className="font-serif text-3xl">{title}</h2>
              <p className="mt-3 leading-7 text-foreground/70">{description}</p>
              <span className="mt-7 inline-block text-sm text-accent">Открыть →</span>
            </Link>
          ))}
        </div>
      </Container>
    </main>
  );
}

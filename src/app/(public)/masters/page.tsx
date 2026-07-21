import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import { masters } from "@/data/studio";

export const metadata: Metadata = {
  title: "Мастера",
  description: "Команда из пяти мастеров студии MUARÉ.",
};

export default function MastersPage() {
  return (
    <main>
      <PageHero
        eyebrow="Команда"
        title="Мастера MUARÉ"
        description="Каждый мастер выполняет весь каталог услуг. Выберите специалиста или найдите ближайшее время у любого мастера."
      />
      <Container className="grid gap-5 py-16 sm:grid-cols-2 sm:py-24 lg:grid-cols-3">
        {masters.map((master, index) => (
          <Link
            className="group min-h-72 rounded-[2px] border border-line bg-surface p-7 transition hover:-translate-y-1 hover:border-accent"
            href={`/masters/${master.slug}`}
            key={master.slug}
          >
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full ${index % 3 === 0 ? "bg-lavender/55" : index % 3 === 1 ? "bg-pistachio/55" : "bg-sand"}`}
            >
              <span className="font-serif text-3xl">
                {master.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </span>
            </div>
            <h2 className="mt-10 font-serif text-3xl font-normal group-hover:text-accent">
              {master.name}
            </h2>
            <p className="mt-4 text-sm text-foreground/65">{master.schedule}</p>
            <span className="mt-8 inline-block text-xs font-medium uppercase tracking-[0.16em]">
              Подробнее →
            </span>
          </Link>
        ))}
      </Container>
    </main>
  );
}

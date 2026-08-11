import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/booking/booking-form";
import { Container } from "@/components/ui/container";
import { getDb } from "@/lib/db";

interface MasterPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: MasterPageProps): Promise<Metadata> {
  const { slug } = await params;
  const master = await getDb().staffProfile.findFirst({
    where: { slug, organization: { slug: "muare" }, isActive: true },
    select: { displayName: true },
  });
  return { title: master?.displayName ?? "Мастер" };
}

export default async function MasterPage({ params }: MasterPageProps) {
  const { slug } = await params;
  const master = await getDb().staffProfile.findFirst({
    where: { slug, organization: { slug: "muare" }, isActive: true },
    select: { id: true, slug: true, displayName: true },
  });
  if (!master) notFound();
  return (
    <main>
      <Container className="grid min-h-[70vh] items-center gap-12 py-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="flex aspect-square max-w-md items-center justify-center rounded-full bg-lavender/45">
          <span className="font-serif text-8xl font-light text-accent">
            {master.displayName
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </span>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-muted">
            Мастер MUARÉ
          </p>
          <h1 className="mt-5 font-serif text-6xl font-light leading-none sm:text-7xl">
            {master.displayName}
          </h1>
          <p className="mt-8 text-lg">
            Выполняет все услуги маникюра и педикюра из каталога студии.
          </p>
          <div className="mt-8 border-y border-line py-5">
            <p>График и свободное время доступны при переходе к онлайн-записи.</p>
            <p className="mt-2 text-sm text-muted">
              Свободные даты и время отображаются при переходе к онлайн-записи.
            </p>
          </div>
        </div>
      </Container>
      <Container className="pb-20 sm:pb-28">
        <section className="border-t border-line pt-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-muted">
            Запись к мастеру
          </p>
          <h2 className="mt-4 font-serif text-5xl font-light">Расписание и свободное время</h2>
          <BookingForm fixedMaster={master} />
        </section>
      </Container>
    </main>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { masters } from "@/data/studio";

interface MasterPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return masters.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: MasterPageProps): Promise<Metadata> {
  const { slug } = await params;
  const master = masters.find((item) => item.slug === slug);
  return { title: master?.name ?? "Мастер" };
}

export default async function MasterPage({ params }: MasterPageProps) {
  const { slug } = await params;
  const master = masters.find((item) => item.slug === slug);
  if (!master) notFound();
  return (
    <main>
      <Container className="grid min-h-[70vh] items-center gap-12 py-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="flex aspect-square max-w-md items-center justify-center rounded-full bg-lavender/45">
          <span className="font-serif text-8xl font-light text-accent">
            {master.name
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
            {master.name}
          </h1>
          <p className="mt-8 text-lg">
            Выполняет все услуги маникюра и педикюра из каталога студии.
          </p>
          <div className="mt-8 border-y border-line py-5">
            <p>{master.schedule}</p>
            <p className="mt-2 text-sm text-muted">
              Свободные даты и время отображаются при переходе к онлайн-записи.
            </p>
          </div>
          <ButtonLink className="mt-10" href={`/booking?master=${master.slug}`}>
            Записаться к мастеру
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "О студии",
  description: "Пространство и подход студии MUARÉ в Брянске.",
};

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="О студии"
        title="Красота в деталях, забота в каждом движении"
        description="MUARÉ — студия ногтевого сервиса, где профессиональный уход соединяется со спокойной атмосферой и вниманием к вашему времени."
      />
      <Container className="grid gap-6 py-16 sm:py-24 lg:grid-cols-2">
        <div className="relative min-h-[560px] overflow-hidden rounded-[2px]">
          <Image
            alt="Рабочее место мастера MUARÉ"
            className="object-cover"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            src="/images/studio/workspace.png"
          />
        </div>
        <div className="flex flex-col justify-center bg-surface p-8 sm:p-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted">
            Наш подход
          </p>
          <h2 className="mt-5 font-serif text-4xl font-light sm:text-5xl">
            Время, посвящённое себе
          </h2>
          <p className="mt-7 leading-8 text-foreground/70">
            Премиальные материалы, мастера с опытом от 9 лет и сервис, ради которого возвращаются.
            Мы создаём понятный и бережный путь от выбора услуги до завершённого образа.
          </p>
          <ul className="mt-8 space-y-4 border-t border-line pt-7">
            <li>Пять мастеров полного профиля</li>
            <li>Онлайн-запись без ожидания ответа</li>
            <li>Спокойный интерьер и внимательный сервис</li>
          </ul>
          <ButtonLink className="mt-10 w-fit" href="/booking">
            Записаться
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}

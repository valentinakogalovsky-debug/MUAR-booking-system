import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

const services = [
  { name: "Маникюр", note: "Уход, покрытие и укрепление", color: "bg-lavender/45" },
  { name: "Педикюр", note: "Классические и SPA-процедуры", color: "bg-pistachio/45" },
  { name: "Две услуги", note: "Один непрерывный визит", color: "bg-lemon/50" },
] as const;

export default function HomePage() {
  return (
    <main>
      <section className="overflow-hidden">
        <Container className="grid min-h-[calc(100svh-5rem)] items-stretch gap-10 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-12">
          <div className="flex flex-col justify-center py-10">
            <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.32em] text-muted">
              Студия ногтевого сервиса · MUARÉ
            </p>
            <h1 className="font-serif text-[clamp(3.3rem,7vw,6.8rem)] font-light leading-[0.92] tracking-[0.01em]">
              Искусство
              <br />
              <span className="italic text-accent">ухоженных рук</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-foreground/70 sm:text-lg">
              Премиальные материалы, мастера с опытом от 9 лет и сервис, ради которого возвращаются.
              Запись онлайн за пару касаний.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/booking">Записаться</ButtonLink>
              <ButtonLink href="/services" variant="ghost">
                Услуги и цены
              </ButtonLink>
            </div>
            <p className="mt-10 text-xs uppercase tracking-[0.18em] text-muted">
              Ежедневно, 09:00–20:00 · Брянск, ул. Куйбышева, 7
            </p>
          </div>
          <div className="relative min-h-[520px] overflow-hidden rounded-[2px] lg:min-h-full">
            <Image
              alt="Зона ресепшен студии MUARÉ"
              className="object-cover"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              src="/images/studio/reception.png"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/55 to-transparent p-6 pt-24 text-xs uppercase tracking-[0.18em] text-white">
              Тёплое пространство для вашего времени
            </div>
          </div>
        </Container>
      </section>
      <Section eyebrow="Направления" title="Уход, который выбирают для себя">
        <div className="grid gap-4 md:grid-cols-3">
          {services.map((service, index) => (
            <Card className={`min-h-56 ${service.color}`} key={service.name}>
              <p className="text-sm italic text-accent">0{index + 1}</p>
              <h3 className="mt-10 font-serif text-3xl font-normal">{service.name}</h3>
              <p className="mt-3 text-sm text-foreground/65">{service.note}</p>
            </Card>
          ))}
        </div>
        <ButtonLink className="mt-8" href="/services" variant="ghost">
          Смотреть все услуги
        </ButtonLink>
      </Section>
      <Section className="bg-surface" eyebrow="Атмосфера" title="Место, где можно замедлиться">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.75fr]">
          <figure className="relative min-h-[520px] overflow-hidden rounded-[2px]">
            <Image
              alt="Зона ожидания студии MUARÉ"
              className="object-cover"
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              src="/images/studio/waiting-area.png"
            />
          </figure>
          <div className="grid gap-4">
            <figure className="relative min-h-64 overflow-hidden rounded-[2px]">
              <Image
                alt="Рабочее место мастера MUARÉ"
                className="object-cover"
                fill
                sizes="(max-width: 1024px) 100vw, 35vw"
                src="/images/studio/workspace.png"
              />
            </figure>
            <figure className="relative min-h-64 overflow-hidden rounded-[2px]">
              <Image
                alt="Детали сервиса MUARÉ"
                className="object-cover"
                fill
                sizes="(max-width: 1024px) 100vw, 35vw"
                src="/images/studio/drinks-corner.png"
              />
            </figure>
          </div>
        </div>
      </Section>
      <section className="bg-accent py-16 text-white sm:py-24">
        <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-lemon">
              Онлайн-запись
            </p>
            <h2 className="mt-4 max-w-2xl font-serif text-4xl font-light leading-[1.05] sm:text-6xl">
              Выберите удобное время для себя
            </h2>
          </div>
          <ButtonLink href="/booking" variant="light">
            Записаться
          </ButtonLink>
        </Container>
      </section>
    </main>
  );
}

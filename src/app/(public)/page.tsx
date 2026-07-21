import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

const directions = [
  {
    title: "Маникюр",
    subtitle: "Уход, покрытие и укрепление",
    paragraphs: [
      "Красивый маникюр начинается задолго до нанесения покрытия. Мы уделяем внимание каждой детали: аккуратно обрабатываем кутикулу, подбираем форму, которая подчеркнёт естественную красоту рук, и работаем только с профессиональными материалами, сохраняющими здоровье ногтевой пластины.",
      "Во время процедуры можно расслабиться, насладиться чашкой ароматного кофе или чая, полистать журнал или просто позволить себе редкую роскошь — никуда не спешить. Пространство студии наполнено мягким естественным светом, спокойной музыкой и ощущением уюта, которое помогает отвлечься от повседневной суеты.",
      "Маникюр в MUARÉ — это не просто уход за руками. Это несколько часов спокойствия, внимания к себе и удовольствия от безупречного результата.",
    ],
    color: "bg-lavender/30",
  },
  {
    title: "Педикюр",
    subtitle: "Классический уход и SPA-процедуры",
    paragraphs: [
      "Педикюр — это возможность сделать паузу и посвятить время себе. Удобные кресла, спокойная атмосфера и размеренный ритм процедуры позволяют полностью расслабиться, пока мастер бережно ухаживает за кожей стоп и ногтями.",
      "Мы сочетаем профессиональный уход с ощущением настоящего комфорта. Тёплые полотенца, деликатная обработка, качественные материалы и внимание к каждой детали превращают обычный визит в приятный ритуал восстановления.",
      "После процедуры остаётся не только ощущение лёгкости и ухоженности, но и желание вернуться за этим состоянием снова.",
    ],
    color: "bg-pistachio/30",
  },
  {
    title: "Две услуги",
    subtitle: "Маникюр и педикюр за один визит",
    paragraphs: [
      "Иногда лучший способ позаботиться о себе — никуда не торопиться. Если вы планируете полный уход, мастер выполнит маникюр и педикюр в рамках одного непрерывного визита, сохраняя единый ритм работы и внимание к каждой детали.",
      "Вам не нужно подстраиваться под разные записи или возвращаться в другой день. За один визит вы получите комплексный уход, сможете спокойно расслабиться, насладиться атмосферой студии и посвятить несколько часов только себе.",
      "Такой формат особенно удобен перед отпуском, важным событием или просто тогда, когда хочется закрыть все бьюти-задачи за одно посещение, не жертвуя качеством сервиса и комфортом.",
    ],
    color: "bg-lemon/35",
  },
] as const;

export default function HomePage() {
  return (
    <>
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
              <p className="mt-8 max-w-xl text-base leading-8 text-foreground/80 sm:text-lg">
                Премиальные материалы, мастера с опытом от 9 лет и сервис, ради которого
                возвращаются. Запись онлайн за пару касаний.
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
                src="/images/studio/reception-home.jpeg"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/55 to-transparent p-6 pt-24 text-xs uppercase tracking-[0.18em] text-white">
                Тёплое пространство для вашего времени
              </div>
            </div>
          </Container>
        </section>
        <Section eyebrow="Направления" title="Уход, который выбирают для себя">
          <div className="divide-y divide-line border-y border-line">
            {directions.map((direction, index) => (
              <article
                className={`grid gap-8 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-12 lg:gap-14 ${direction.color}`}
                key={direction.title}
              >
                <div className="lg:col-span-4">
                  <p className="text-sm italic text-accent">0{index + 1}</p>
                  <h3 className="mt-6 max-w-md font-serif text-4xl font-normal leading-tight sm:text-5xl">
                    {direction.title}
                  </h3>
                  <p className="mt-4 text-sm uppercase tracking-[0.14em] text-muted">
                    {direction.subtitle}
                  </p>
                </div>
                <div className="space-y-5 leading-8 text-foreground/80 lg:col-span-7 lg:col-start-6">
                  {direction.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/services" variant="ghost">
              Смотреть все услуги
            </ButtonLink>
            <ButtonLink href="/booking">Записаться</ButtonLink>
          </div>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "О студии",
  description:
    "Познакомьтесь с атмосферой MUARÉ — спокойным пространством ногтевого сервиса в Брянске, созданным для отдыха и заботы о себе.",
};

const editorialPhotos = [
  {
    src: "/images/studio/reception.png",
    alt: "Светлая зона встречи студии MUARÉ",
    caption: "Мягкий дневной свет сопровождает нас весь день.",
    className: "lg:col-span-7",
    aspect: "aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]",
  },
  {
    src: "/images/studio/workspace.png",
    alt: "Чистое рабочее место мастера MUARÉ",
    caption: "Пространство, где каждая деталь продумана для вашего комфорта.",
    className: "lg:col-span-5 lg:mt-28",
    aspect: "aspect-[4/5]",
  },
  {
    src: "/images/studio/waiting-area.png",
    alt: "Уютная зона ожидания студии MUARÉ",
    caption: "Тихий уголок, в котором можно оставить суету за дверью.",
    className: "lg:col-span-5 lg:mt-20",
    aspect: "aspect-[4/5]",
  },
  {
    src: "/images/studio/drinks-corner.png",
    alt: "Уголок с чаем и кофе в студии MUARÉ",
    caption: "Небольшая пауза с чашкой чая перед процедурой.",
    className: "lg:col-span-7",
    aspect: "aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]",
  },
  {
    src: "/images/studio/texture-detail.png",
    alt: "Керамика, текстиль и природные детали интерьера MUARÉ",
    caption: "Натуральные материалы, к которым приятно прикасаться.",
    className: "lg:col-span-8 lg:col-start-3 lg:mt-20",
    aspect: "aspect-[4/5] sm:aspect-[3/2]",
  },
] as const;

export default function AboutPage() {
  return (
    <main>
      <section className="border-b border-line py-16 sm:py-24 lg:py-32">
        <Container>
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-muted">О студии</p>
          <h1 className="mt-6 max-w-5xl font-serif text-5xl font-light leading-[0.98] sm:text-7xl lg:text-8xl">
            Пространство, в котором хочется задержаться
          </h1>
          <p className="mt-8 max-w-3xl text-lg leading-8 text-foreground/70 sm:text-xl">
            MUARÉ — это не просто студия ногтевого сервиса. Это место, где время словно замедляется,
            а забота ощущается в каждой детали — от мягкого света до первого глотка ароматного чая.
          </p>
        </Container>
      </section>

      <Container className="py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <p className="font-serif text-3xl font-light leading-tight sm:text-4xl lg:col-span-5">
            Каждая деталь пространства создана с одной целью — чтобы вы почувствовали себя спокойно
            с первых минут.
          </p>
          <div className="space-y-6 leading-8 text-foreground/70 lg:col-span-6 lg:col-start-7">
            <p>
              Тёплые природные оттенки, натуральные материалы, мягкий дневной свет и продуманная
              атмосфера помогают оставить суету за дверью и посвятить время только себе. Здесь нет
              перегруженного декора, ярких вывесок или показной роскоши. Вместо этого — ощущение
              уюта, чистоты и гармонии.
            </p>
            <p>
              Во время процедуры вы можете расслабиться в удобном кресле, насладиться чашкой
              свежесваренного кофе или ароматного чая, спокойно почитать книгу или просто побыть в
              тишине. Мы верим, что настоящий премиальный сервис начинается не с дорогого интерьера,
              а с чувства комфорта, которое остаётся с вами ещё долго после визита.
            </p>
            <p>
              MUARÉ — пространство, куда возвращаются не только за красивым маникюром, но и за тем
              редким ощущением внутреннего спокойствия, которого так не хватает в повседневной
              жизни.
            </p>
          </div>
        </div>

        <div className="mt-20 grid gap-x-6 gap-y-14 sm:mt-28 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-24">
          {editorialPhotos.map((photo) => (
            <figure className={photo.className} key={photo.src}>
              <div className={`relative overflow-hidden rounded-[2px] ${photo.aspect}`}>
                <Image
                  alt={photo.alt}
                  className="object-cover transition duration-700 hover:scale-[1.015]"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 58vw"
                  src={photo.src}
                />
              </div>
              <figcaption className="mt-4 max-w-md text-sm leading-6 text-foreground/65">
                {photo.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>

      <section className="bg-accent py-16 text-white sm:py-24">
        <Container className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-lemon">
              Почувствуйте атмосферу MUARÉ лично
            </p>
            <h2 className="mt-5 max-w-3xl font-serif text-4xl font-light leading-tight sm:text-6xl">
              Выберите удобное время и позвольте нам позаботиться обо всём остальном.
            </h2>
          </div>
          <ButtonLink href="/booking" variant="light">
            Записаться на визит
          </ButtonLink>
        </Container>
      </section>
    </main>
  );
}

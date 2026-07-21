import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { additions, services } from "@/data/studio";

export const metadata: Metadata = {
  title: "Услуги и цены",
  description: "Услуги маникюра и педикюра студии MUARÉ в Брянске.",
};

export default function ServicesPage() {
  return (
    <main>
      <PageHero
        eyebrow="Каталог MUARÉ"
        title="Услуги и цены"
        description="Все пять мастеров выполняют полный каталог. К каждой процедуре добавляется 15 минут на подготовку рабочего места."
      />
      <Container className="py-16 sm:py-24">
        {["Маникюр", "Педикюр"].map((category) => (
          <section className="mb-16 last:mb-0" key={category}>
            <h2 className="mb-7 font-serif text-4xl font-light sm:text-5xl">{category}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {services
                .filter((service) => service.category === category)
                .map((service) => (
                  <Card key={service.name}>
                    <div className="flex items-start justify-between gap-5">
                      <h3 className="font-serif text-2xl font-normal leading-tight">
                        {service.name}
                      </h3>
                      <p className="shrink-0 font-serif text-2xl text-accent">{service.price}</p>
                    </div>
                    <p className="mt-5 text-xs uppercase tracking-[0.18em] text-muted">
                      {service.duration}
                    </p>
                  </Card>
                ))}
            </div>
          </section>
        ))}
        <section className="mt-20 border-t border-line pt-16">
          <h2 className="font-serif text-4xl font-light sm:text-5xl">Покрытие и дизайн</h2>
          <p className="mt-4 max-w-2xl text-foreground/75">
            Дополнения влияют на стоимость, но не увеличивают длительность основной записи.
          </p>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {additions.map(([name, price]) => (
              <div className="flex items-center justify-between gap-5 py-4" key={name}>
                <span>{name}</span>
                <strong className="font-serif text-xl font-normal text-accent">{price}</strong>
              </div>
            ))}
          </div>
        </section>
        <ButtonLink className="mt-12" href="/booking">
          Выбрать время
        </ButtonLink>
      </Container>
    </main>
  );
}

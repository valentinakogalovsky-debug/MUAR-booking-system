import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Адрес, телефон и часы работы студии MUARÉ в Брянске.",
};

export default function ContactsPage() {
  return (
    <main>
      <PageHero
        eyebrow="Брянск"
        title="Будем рады видеть вас в MUARÉ"
        description="Свяжитесь со студией или выберите удобное время через онлайн-запись."
      />
      <Container className="grid gap-6 py-16 sm:py-24 lg:grid-cols-2">
        <div className="bg-surface p-8 sm:p-12">
          <dl className="space-y-8">
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-muted">Адрес</dt>
              <dd className="mt-2 font-serif text-3xl">Брянск, ул. Куйбышева, 7</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-muted">Телефон</dt>
              <dd className="mt-2">
                <a className="font-serif text-3xl text-accent" href="tel:+79038184486">
                  +7 903 818-44-86
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-muted">Часы работы</dt>
              <dd className="mt-2 font-serif text-3xl">Ежедневно, 09:00–20:00</dd>
            </div>
          </dl>
          <ButtonLink className="mt-10" href="/booking">
            Записаться онлайн
          </ButtonLink>
        </div>
        <div className="relative min-h-[520px] overflow-hidden rounded-[2px]">
          <Image
            alt="Ресепшен студии MUARÉ"
            className="object-cover"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            src="/images/studio/reception.png"
          />
        </div>
      </Container>
    </main>
  );
}

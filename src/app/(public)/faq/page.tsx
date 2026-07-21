import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { faqs } from "@/data/studio";

export const metadata: Metadata = { title: "Частые вопросы" };

export default function FaqPage() {
  return (
    <main>
      <PageHero
        eyebrow="Помощь"
        title="Частые вопросы"
        description="Всё важное об онлайн-записи, переносе, отмене и услугах MUARÉ."
      />
      <Container className="max-w-4xl py-16 sm:py-24">
        <div className="divide-y divide-line border-y border-line">
          {faqs.map(([question, answer], index) => (
            <details className="group py-6" key={question} open={index === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-serif text-2xl">
                <span>{question}</span>
                <span className="text-accent transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 max-w-2xl leading-7 text-foreground/65">{answer}</p>
            </details>
          ))}
        </div>
        <ButtonLink className="mt-10" href="/booking">
          Перейти к записи
        </ButtonLink>
      </Container>
    </main>
  );
}

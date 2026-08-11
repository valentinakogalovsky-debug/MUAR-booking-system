import type { Metadata } from "next";
import { BookingForm } from "@/components/booking/booking-form";
import { PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Заявка на запись" };
const steps = ["Услуга", "Дата", "Время", "Мастер", "Контакты"];

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  return (
    <main>
      <PageHero
        eyebrow="Заявка на запись"
        title="Выберите удобное время"
        description="Выберите свободное время и оставьте контактные данные. Администратор позвонит, чтобы подтвердить запись."
      />
      <Container className="py-16 sm:py-24">
        <ol className="grid gap-3 sm:grid-cols-5">
          {steps.map((step, index) => (
            <li className="rounded-[2px] border border-line bg-surface p-4" key={step}>
              <span className="font-serif text-xl text-accent">0{index + 1}</span>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em]">{step}</p>
            </li>
          ))}
        </ol>
        <BookingForm initialServiceId={service} />
      </Container>
    </main>
  );
}

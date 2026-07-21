import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Онлайн-запись" };
const steps = ["Услуга", "Мастер", "Дата", "Время", "Подтверждение"];

export default function BookingPage() {
  return (
    <main>
      <PageHero
        eyebrow="Онлайн-запись"
        title="Выберите удобное время"
        description="Интерфейс записи будет подключён к реальному расписанию после настройки базы данных."
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
        <Card className="mt-8 text-center">
          <h2 className="font-serif text-4xl font-light">Модуль готовится к подключению</h2>
          <p className="mx-auto mt-4 max-w-xl text-foreground/75">
            На следующих этапах здесь появятся услуги, мастера и свободные интервалы с шагом 15
            минут.
          </p>
        </Card>
      </Container>
    </main>
  );
}

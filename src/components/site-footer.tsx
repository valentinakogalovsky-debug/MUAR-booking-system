import Link from "next/link";
import { Container } from "@/components/ui/container";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-foreground py-12 text-background sm:py-16">
      <Container className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Link className="font-serif text-4xl font-light tracking-[0.14em]" href="/">
            MUAR<span className="text-lemon">É</span>
          </Link>
          <p className="mt-3 text-xs uppercase tracking-[0.24em] text-background/60">
            Nail Studio · Брянск
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-lemon">Контакты</p>
          <address className="mt-4 space-y-2 text-sm not-italic text-background/80">
            <p>Ежедневно, 09:00–20:00</p>
            <p>ул. Куйбышева, 7</p>
            <a className="block hover:text-lemon" href="tel:+79038184486">
              +7 903 818-44-86
            </a>
          </address>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-lemon">Клиентам</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-background/80">
            <Link className="hover:text-lemon" href="/booking">
              Записаться онлайн
            </Link>
            <Link className="hover:text-lemon" href="/my-bookings">
              Мои записи
            </Link>
            <Link className="hover:text-lemon" href="/faq">
              Частые вопросы
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

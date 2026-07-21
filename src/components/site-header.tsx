import Link from "next/link";
import { Container } from "@/components/ui/container";
import { MobileNavigation } from "@/components/mobile-navigation";

const navigation = [
  { label: "О студии", href: "/about" },
  { label: "Услуги и цены", href: "/services" },
  { label: "Мастера", href: "/masters" },
  { label: "Интерьер", href: "/interior" },
  { label: "Контакты", href: "/contacts" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/95 backdrop-blur">
      <Container className="relative flex min-h-20 items-center justify-between gap-6">
        <Link
          aria-label="MUARÉ — главная"
          className="font-serif text-3xl font-light tracking-[0.14em]"
          href="/"
        >
          MUAR<span className="text-accent">É</span>
        </Link>
        <nav aria-label="Основная навигация" className="hidden md:block">
          <ul className="flex items-center gap-5 lg:gap-7">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/75 transition hover:text-accent"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                className="inline-flex min-h-11 items-center rounded-[2px] bg-accent px-5 text-[11px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-[#756494]"
                href="/booking"
              >
                Записаться
              </Link>
            </li>
          </ul>
        </nav>
        <MobileNavigation items={navigation} />
      </Container>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

interface NavigationItem {
  label: string;
  href: string;
}

export function MobileNavigation({ items }: { items: readonly NavigationItem[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
        className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-[2px] border border-line bg-surface"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <span
          className={`h-px w-5 bg-foreground transition ${isOpen ? "translate-y-[3.5px] rotate-45" : ""}`}
        />
        <span
          className={`h-px w-5 bg-foreground transition ${isOpen ? "-translate-y-[3.5px] -rotate-45" : ""}`}
        />
      </button>
      {isOpen ? (
        <nav
          aria-label="Мобильная навигация"
          className="absolute inset-x-0 top-full border-y border-line bg-background px-5 py-6 shadow-lg"
          id="mobile-navigation"
        >
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  className="block border-b border-line py-3 font-serif text-2xl"
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            className="mt-6 flex min-h-12 items-center justify-center rounded-[2px] bg-accent px-6 text-xs font-medium uppercase tracking-[0.16em] text-white hover:bg-[#756494]"
            href="/booking"
            onClick={() => setIsOpen(false)}
          >
            Записаться онлайн
          </Link>
        </nav>
      ) : null}
    </div>
  );
}

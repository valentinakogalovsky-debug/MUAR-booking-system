import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";

export function Section({
  eyebrow,
  title,
  children,
  className = "",
  id,
}: {
  eyebrow?: string;
  title?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={`border-t border-line py-16 sm:py-24 ${className}`} id={id}>
      <Container>
        {eyebrow ? (
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.32em] text-muted">
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h2 className="mb-10 font-serif text-4xl font-light leading-[1.08] sm:text-6xl">
            {title}
          </h2>
        ) : null}
        {children}
      </Container>
    </section>
  );
}

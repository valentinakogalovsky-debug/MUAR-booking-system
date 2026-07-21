import { Container } from "@/components/ui/container";

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="border-b border-line py-16 sm:py-24">
      <Container>
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-muted">{eyebrow}</p>
        <h1 className="mt-5 max-w-5xl font-serif text-5xl font-light leading-[0.98] sm:text-7xl">
          {title}
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-8 text-foreground/80 sm:text-lg">
          {description}
        </p>
      </Container>
    </section>
  );
}

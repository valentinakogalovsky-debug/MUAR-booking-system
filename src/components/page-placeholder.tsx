import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

interface PagePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}

export function PagePlaceholder({
  eyebrow,
  title,
  description,
  actionHref = "/",
  actionLabel = "На главную",
}: PagePlaceholderProps) {
  return (
    <main className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -right-24 top-12 h-72 w-72 rounded-full bg-lavender/35 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -left-20 bottom-10 h-60 w-60 rounded-full bg-pistachio/30 blur-3xl"
      />
      <Container className="relative flex min-h-[68vh] flex-col justify-center py-20 sm:py-28">
        <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.32em] text-muted">
          {eyebrow}
        </p>
        <h1 className="max-w-4xl font-serif text-5xl font-light leading-[0.98] tracking-[0.01em] sm:text-7xl lg:text-8xl">
          {title}
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-8 text-foreground/80 sm:text-lg">
          {description}
        </p>
        <ButtonLink className="mt-10 w-fit" href={actionHref}>
          {actionLabel}
        </ButtonLink>
      </Container>
    </main>
  );
}

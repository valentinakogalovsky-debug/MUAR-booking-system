import Image from "next/image";
import { Container } from "@/components/ui/container";

const photos = [
  ["reception.png", "Зона встречи"],
  ["workspace.png", "Рабочее место"],
  ["waiting-area.png", "Зона ожидания"],
  ["texture-detail.png", "Детали и текстуры"],
  ["drinks-corner.png", "Уголок с напитками"],
] as const;

export default function InteriorPage() {
  return (
    <main>
      <Container className="py-16 sm:py-24">
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-muted">
          Пространство MUARÉ
        </p>
        <h1 className="mt-5 max-w-4xl font-serif text-5xl font-light leading-none sm:text-7xl">
          Интерьер, в котором легко замедлиться
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-foreground/70">
          Тёплый свет, природные оттенки и спокойные детали создают пространство для отдыха и
          бережного ухода.
        </p>
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {photos.map(([file, label], index) => (
            <figure
              className={`group ${index === 0 || index === 3 ? "sm:col-span-2" : ""}`}
              key={file}
            >
              <div
                className={`relative overflow-hidden rounded-[2px] ${index === 0 || index === 3 ? "aspect-[16/9]" : "aspect-[4/5]"}`}
              >
                <Image
                  alt={`${label} студии MUARÉ`}
                  className="object-cover transition duration-700 group-hover:scale-[1.02]"
                  fill
                  sizes={index === 0 || index === 3 ? "100vw" : "(max-width: 640px) 100vw, 50vw"}
                  src={`/images/studio/${file}`}
                />
              </div>
              <figcaption className="mt-3 text-xs uppercase tracking-[0.2em] text-muted">
                {label}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </main>
  );
}

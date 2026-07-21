import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <article className={`rounded-[2px] border border-line bg-surface p-6 sm:p-8 ${className}`}>
      {children}
    </article>
  );
}

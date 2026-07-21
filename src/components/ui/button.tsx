import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

const styles = {
  primary: "border-accent bg-accent text-white hover:border-[#756494] hover:bg-[#756494]",
  accent: "border-accent bg-accent text-white hover:border-foreground hover:bg-foreground",
  light: "border-white bg-white text-accent hover:border-[#F7F1EC] hover:bg-[#F7F1EC]",
  ghost:
    "border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-[#F7F1EC]",
} as const;

const base =
  "inline-flex min-h-12 items-center justify-center rounded-[2px] border px-7 py-3 text-xs font-medium uppercase tracking-[0.16em] transition-colors focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50";

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof styles;
  className?: string;
}) {
  return (
    <Link className={`${base} ${styles[variant]} ${className}`} href={href}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof styles }) {
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

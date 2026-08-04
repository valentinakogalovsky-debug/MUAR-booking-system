import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getVerifiedSession } from "@/lib/auth/permissions";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Вход" };

export default async function SignInPage() {
  const session = await getVerifiedSession();
  if (session?.user) redirect(session.user.role === "ADMIN" ? "/admin" : "/staff");

  return (
    <main className="flex min-h-screen items-center py-16">
      <Container>
        <section className="mx-auto max-w-md border border-line bg-surface p-7 sm:p-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-muted">Доступ</p>
          <h1 className="mt-5 font-serif text-5xl font-light">Вход в систему</h1>
          <p className="mt-5 leading-7 text-foreground/75">
            Вход доступен только администратору и мастерам MUARÉ.
          </p>
          <SignInForm />
        </section>
      </Container>
    </main>
  );
}

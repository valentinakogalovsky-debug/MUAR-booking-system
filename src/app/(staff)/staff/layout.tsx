import Link from "next/link";
import { Role } from "@/generated/prisma/client";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { requireRole } from "@/lib/auth/permissions";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireRole(Role.STAFF);
  return (
    <>
      <header className="border-b border-line bg-surface">
        <Container className="flex flex-wrap items-center justify-between gap-5 py-5">
          <Link className="font-serif text-3xl" href="/staff">
            MUARÉ · Мастер
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/sign-in" });
            }}
          >
            <Button type="submit" variant="ghost">
              Выйти
            </Button>
          </form>
        </Container>
      </header>
      {children}
    </>
  );
}

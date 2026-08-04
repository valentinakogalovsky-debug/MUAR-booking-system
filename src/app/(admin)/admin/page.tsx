import { PagePlaceholder } from "@/components/page-placeholder";
import { Role } from "@/generated/prisma/client";
import { requireRole } from "@/lib/auth/permissions";

export default async function AdminPage() {
  await requireRole(Role.ADMIN);
  return (
    <PagePlaceholder
      eyebrow="Управление"
      title="Панель администратора"
      description="Вход и защита кабинета работают. Административные инструменты будут добавлены на следующих этапах."
    />
  );
}

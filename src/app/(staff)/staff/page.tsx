import { PagePlaceholder } from "@/components/page-placeholder";
import { Role } from "@/generated/prisma/client";
import { requireRole } from "@/lib/auth/permissions";

export default async function StaffPage() {
  await requireRole(Role.STAFF);
  return (
    <PagePlaceholder
      eyebrow="Рабочее пространство"
      title="Кабинет мастера"
      description="Вход и защита кабинета работают. Личное расписание будет добавлено на следующих этапах."
    />
  );
}

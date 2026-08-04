import { Role } from "@/generated/prisma/client";
import { Container } from "@/components/ui/container";
import { listAudit } from "@/lib/admin/staff";
import { requireRole } from "@/lib/auth/permissions";

const actionNames: Record<string, string> = {
  SERVICE_CREATED: "Добавлена услуга",
  SERVICE_UPDATED: "Изменена услуга",
  SERVICE_ACTIVATED: "Услуга включена",
  SERVICE_DEACTIVATED: "Услуга отключена",
  SERVICE_DELETED: "Услуга удалена",
  ADDON_CREATED: "Добавлено дополнение",
  ADDON_UPDATED: "Изменено дополнение",
  ADDON_ACTIVATED: "Дополнение включено",
  ADDON_DEACTIVATED: "Дополнение отключено",
  ADDON_DELETED: "Дополнение удалено",
  STAFF_UPDATED: "Изменён мастер",
  STAFF_DEACTIVATED: "Мастер отключён",
  SETTINGS_UPDATED: "Изменены настройки записи",
};

export default async function AuditPage() {
  const session = await requireRole(Role.ADMIN);
  const entries = await listAudit(session.user.organizationId);
  return (
    <main>
      <Container className="py-12 sm:py-16">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Безопасность</p>
        <h1 className="mt-4 font-serif text-5xl font-light">Журнал изменений</h1>
        <div className="mt-10 overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-4">Дата</th>
                <th className="p-4">Действие</th>
                <th className="p-4">Кто</th>
                <th className="p-4">Объект</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="p-4">
                    {new Intl.DateTimeFormat("ru-RU", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "Europe/Moscow",
                    }).format(entry.createdAt)}
                  </td>
                  <td className="p-4">{actionNames[entry.action] ?? entry.action}</td>
                  <td className="p-4">
                    {entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : "Система"}
                  </td>
                  <td className="p-4 font-mono text-xs text-muted">{entry.entityId}</td>
                </tr>
              ))}
              {entries.length === 0 ? (
                <tr>
                  <td className="p-8 text-center text-muted" colSpan={4}>
                    Изменений пока нет.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Container>
    </main>
  );
}

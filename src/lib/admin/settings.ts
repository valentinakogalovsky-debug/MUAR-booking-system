import "server-only";

import { AuditEntityType } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import type { AdminActor } from "./catalog";
import { settingsInputSchema } from "./validation";

export function getSettings(organizationId: string) {
  return getDb().organizationSettings.findUniqueOrThrow({ where: { organizationId } });
}

export async function updateSettings(actor: AdminActor, input: unknown) {
  const value = settingsInputSchema.parse(input);
  return getDb().$transaction(async (tx) => {
    const previous = await tx.organizationSettings.findUniqueOrThrow({
      where: { organizationId: actor.organizationId },
    });
    const settings = await tx.organizationSettings.update({
      where: { organizationId: actor.organizationId },
      data: value,
    });
    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "SETTINGS_UPDATED",
        entityType: AuditEntityType.SETTINGS,
        entityId: actor.organizationId,
        metadata: {
          previous: {
            minimumLeadMinutes: previous.minimumLeadMinutes,
            bookingHorizonDays: previous.bookingHorizonDays,
          },
          next: value,
        },
      },
    });
    return settings;
  });
}

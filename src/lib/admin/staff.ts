import "server-only";

import { AuditEntityType } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import type { AdminActor } from "./catalog";
import { parseId, staffInputSchema } from "./validation";

export function listStaff(organizationId: string) {
  return getDb().staffProfile.findMany({
    where: { organizationId },
    orderBy: { displayName: "asc" },
    include: {
      user: { select: { phone: true, status: true } },
      services: { select: { serviceId: true } },
    },
  });
}

export async function updateStaff(actor: AdminActor, idInput: unknown, input: unknown) {
  const id = parseId(idInput);
  const value = staffInputSchema.parse(input);
  return getDb().$transaction(async (tx) => {
    await tx.staffProfile.findFirstOrThrow({ where: { id, organizationId: actor.organizationId } });
    const staff = await tx.staffProfile.update({ where: { id }, data: value });

    if (value.isActive) {
      const services = await tx.service.findMany({
        where: { organizationId: actor.organizationId },
        select: { id: true },
      });
      await tx.staffService.createMany({
        data: services.map((service) => ({ staffId: id, serviceId: service.id })),
        skipDuplicates: true,
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: value.isActive ? "STAFF_UPDATED" : "STAFF_DEACTIVATED",
        entityType: AuditEntityType.STAFF,
        entityId: id,
        metadata: { displayName: value.displayName, isActive: value.isActive },
      },
    });
    return staff;
  });
}

export function listAudit(organizationId: string) {
  return getDb().auditLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { firstName: true, lastName: true } } },
  });
}

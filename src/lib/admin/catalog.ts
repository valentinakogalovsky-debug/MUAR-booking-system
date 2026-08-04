import "server-only";

import { AuditEntityType, type Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { addonInputSchema, parseId, serviceInputSchema } from "./validation";

export type AdminActor = { userId: string; organizationId: string };

function audit(
  actor: AdminActor,
  action: string,
  entityId: string,
  metadata?: Prisma.InputJsonValue,
) {
  return {
    organizationId: actor.organizationId,
    userId: actor.userId,
    action,
    entityType: AuditEntityType.SERVICE,
    entityId,
    metadata,
  };
}

export async function listCatalog(organizationId: string) {
  const db = getDb();
  const [services, addons] = await Promise.all([
    db.service.findMany({
      where: { organizationId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: { _count: { select: { bookingItems: true, staff: true } } },
    }),
    db.serviceAddon.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
  ]);
  return { services, addons };
}

export async function createService(actor: AdminActor, input: unknown) {
  const value = serviceInputSchema.parse(input);
  return getDb().$transaction(async (tx) => {
    const service = await tx.service.create({
      data: {
        organizationId: actor.organizationId,
        name: value.name,
        category: value.category,
        durationMinutes: value.durationMinutes,
        priceMinor: value.priceRubles * 100,
        description: value.description || null,
        staff: {
          create: (
            await tx.staffProfile.findMany({
              where: { organizationId: actor.organizationId },
              select: { id: true },
            })
          ).map(({ id }) => ({ staffId: id })),
        },
      },
    });
    await tx.auditLog.create({ data: audit(actor, "SERVICE_CREATED", service.id) });
    return service;
  });
}

export async function updateService(actor: AdminActor, idInput: unknown, input: unknown) {
  const id = parseId(idInput);
  const value = serviceInputSchema.parse(input);
  return getDb().$transaction(async (tx) => {
    const existing = await tx.service.findFirstOrThrow({
      where: { id, organizationId: actor.organizationId },
    });
    const service = await tx.service.update({
      where: { id },
      data: {
        name: value.name,
        category: value.category,
        durationMinutes: value.durationMinutes,
        priceMinor: value.priceRubles * 100,
        description: value.description || null,
      },
    });
    await tx.auditLog.create({
      data: audit(actor, "SERVICE_UPDATED", id, {
        previous: { priceMinor: existing.priceMinor, durationMinutes: existing.durationMinutes },
        next: { priceMinor: service.priceMinor, durationMinutes: service.durationMinutes },
      }),
    });
    return service;
  });
}

export async function setServiceActive(actor: AdminActor, idInput: unknown, isActive: boolean) {
  const id = parseId(idInput);
  return getDb().$transaction(async (tx) => {
    const service = await tx.service.update({
      where: { id, organizationId: actor.organizationId },
      data: { isActive },
    });
    await tx.auditLog.create({
      data: audit(actor, isActive ? "SERVICE_ACTIVATED" : "SERVICE_DEACTIVATED", id),
    });
    return service;
  });
}

export async function removeService(actor: AdminActor, idInput: unknown) {
  const id = parseId(idInput);
  return getDb().$transaction(async (tx) => {
    const service = await tx.service.findFirstOrThrow({
      where: { id, organizationId: actor.organizationId },
      include: { _count: { select: { bookingItems: true } } },
    });

    if (service._count.bookingItems > 0) {
      await tx.service.update({ where: { id }, data: { isActive: false } });
      await tx.auditLog.create({ data: audit(actor, "SERVICE_DEACTIVATED", id) });
      return "deactivated" as const;
    }

    await tx.service.delete({ where: { id } });
    await tx.auditLog.create({ data: audit(actor, "SERVICE_DELETED", id) });
    return "deleted" as const;
  });
}

export async function createAddon(actor: AdminActor, input: unknown) {
  const value = addonInputSchema.parse(input);
  return getDb().$transaction(async (tx) => {
    const addon = await tx.serviceAddon.create({
      data: {
        organizationId: actor.organizationId,
        name: value.name,
        isIncluded: value.priceType === "INCLUDED",
        priceMinor: value.priceType === "FIXED" ? value.priceRubles! * 100 : null,
        minimumPriceMinor: value.priceType === "FROM" ? value.priceRubles! * 100 : null,
        affectsDuration: false,
      },
    });
    await tx.auditLog.create({ data: audit(actor, "ADDON_CREATED", addon.id) });
    return addon;
  });
}

export async function updateAddon(actor: AdminActor, idInput: unknown, input: unknown) {
  const id = parseId(idInput);
  const value = addonInputSchema.parse(input);
  return getDb().$transaction(async (tx) => {
    await tx.serviceAddon.findFirstOrThrow({ where: { id, organizationId: actor.organizationId } });
    const addon = await tx.serviceAddon.update({
      where: { id },
      data: {
        name: value.name,
        isIncluded: value.priceType === "INCLUDED",
        priceMinor: value.priceType === "FIXED" ? value.priceRubles! * 100 : null,
        minimumPriceMinor: value.priceType === "FROM" ? value.priceRubles! * 100 : null,
        affectsDuration: false,
      },
    });
    await tx.auditLog.create({ data: audit(actor, "ADDON_UPDATED", id) });
    return addon;
  });
}

export async function setAddonActive(actor: AdminActor, idInput: unknown, isActive: boolean) {
  const id = parseId(idInput);
  return getDb().$transaction(async (tx) => {
    const addon = await tx.serviceAddon.update({
      where: { id, organizationId: actor.organizationId },
      data: { isActive },
    });
    await tx.auditLog.create({
      data: audit(actor, isActive ? "ADDON_ACTIVATED" : "ADDON_DEACTIVATED", id),
    });
    return addon;
  });
}

export async function removeAddon(actor: AdminActor, idInput: unknown) {
  const id = parseId(idInput);
  return getDb().$transaction(async (tx) => {
    await tx.serviceAddon.findFirstOrThrow({ where: { id, organizationId: actor.organizationId } });
    await tx.serviceAddon.delete({ where: { id } });
    await tx.auditLog.create({ data: audit(actor, "ADDON_DELETED", id) });
  });
}

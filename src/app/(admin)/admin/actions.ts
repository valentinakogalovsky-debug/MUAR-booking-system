"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { Role } from "@/generated/prisma/client";
import {
  createAddon,
  createService,
  removeAddon,
  removeService,
  setAddonActive,
  setServiceActive,
  updateAddon,
  updateService,
} from "@/lib/admin/catalog";
import { updateSettings } from "@/lib/admin/settings";
import { createException, removeException } from "@/lib/admin/schedule";
import { updateStaff } from "@/lib/admin/staff";
import { requireRole } from "@/lib/auth/permissions";
import { cancelBooking, confirmBooking, rescheduleBooking } from "@/lib/booking/admin";

async function actor() {
  const session = await requireRole(Role.ADMIN);
  return { userId: session.user.id, organizationId: session.user.organizationId };
}

function values(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

async function complete(operation: () => Promise<unknown>, path: string, success: string) {
  const separator = path.includes("?") ? "&" : "?";
  let location = `${path}${separator}success=${encodeURIComponent(success)}`;
  try {
    await operation();
    revalidatePath(path);
  } catch (error) {
    const message =
      error instanceof ZodError
        ? error.issues[0]?.message || "Проверьте заполненные поля"
        : "Не удалось сохранить изменения";
    location = `${path}${separator}error=${encodeURIComponent(message)}`;
  }
  redirect(location);
}

export async function createServiceAction(formData: FormData) {
  const admin = await actor();
  await complete(
    () => createService(admin, values(formData)),
    "/admin/catalog",
    "Услуга добавлена",
  );
}

export async function updateServiceAction(formData: FormData) {
  const admin = await actor();
  await complete(
    () => updateService(admin, formData.get("id"), values(formData)),
    "/admin/catalog",
    "Услуга обновлена",
  );
}

export async function toggleServiceAction(formData: FormData) {
  const admin = await actor();
  const active = formData.get("isActive") === "true";
  await complete(
    () => setServiceActive(admin, formData.get("id"), active),
    "/admin/catalog",
    active ? "Услуга включена" : "Услуга отключена",
  );
}

export async function removeServiceAction(formData: FormData) {
  const admin = await actor();
  await complete(
    () => removeService(admin, formData.get("id")),
    "/admin/catalog",
    "Услуга удалена или отключена, если уже использовалась",
  );
}

export async function createAddonAction(formData: FormData) {
  const admin = await actor();
  await complete(
    () => createAddon(admin, values(formData)),
    "/admin/catalog",
    "Дополнение добавлено",
  );
}

export async function updateAddonAction(formData: FormData) {
  const admin = await actor();
  await complete(
    () => updateAddon(admin, formData.get("id"), values(formData)),
    "/admin/catalog",
    "Дополнение обновлено",
  );
}

export async function toggleAddonAction(formData: FormData) {
  const admin = await actor();
  const active = formData.get("isActive") === "true";
  await complete(
    () => setAddonActive(admin, formData.get("id"), active),
    "/admin/catalog",
    active ? "Дополнение включено" : "Дополнение отключено",
  );
}

export async function removeAddonAction(formData: FormData) {
  const admin = await actor();
  await complete(
    () => removeAddon(admin, formData.get("id")),
    "/admin/catalog",
    "Дополнение удалено",
  );
}

export async function updateSettingsAction(formData: FormData) {
  const admin = await actor();
  await complete(
    () => updateSettings(admin, values(formData)),
    "/admin/settings",
    "Настройки сохранены",
  );
}

export async function updateStaffAction(formData: FormData) {
  const admin = await actor();
  await complete(
    () => updateStaff(admin, formData.get("id"), values(formData)),
    "/admin/staff",
    "Данные мастера сохранены",
  );
}

export async function createExceptionAction(formData: FormData) {
  const admin = await actor();
  await complete(
    () => createException(admin, values(formData)),
    `/admin/schedule?date=${encodeURIComponent(String(formData.get("dateFrom") || ""))}`,
    "Изменение графика добавлено",
  );
}

export async function removeExceptionAction(formData: FormData) {
  const admin = await actor();
  await complete(
    () => removeException(admin, String(formData.get("id"))),
    `/admin/schedule?date=${encodeURIComponent(String(formData.get("date") || ""))}`,
    "Изменение графика удалено",
  );
}

export async function confirmBookingAction(formData: FormData) {
  const admin = await actor();
  await complete(
    () => confirmBooking(admin, String(formData.get("id"))),
    "/admin/bookings?status=PENDING",
    "Заявка подтверждена",
  );
}

export async function cancelBookingAction(formData: FormData) {
  const admin = await actor();
  const status = String(formData.get("returnStatus") || "PENDING");
  const requestedPath = String(formData.get("returnPath") || "");
  const returnPath = requestedPath.startsWith("/admin/appointments?")
    ? requestedPath
    : `/admin/bookings?status=${encodeURIComponent(status)}`;
  await complete(
    () =>
      cancelBooking(admin, String(formData.get("id")), {
        reason: formData.get("reason"),
      }),
    returnPath,
    "Запись отменена",
  );
}

export async function rescheduleBookingAction(formData: FormData) {
  const admin = await actor();
  const id = String(formData.get("id"));
  await complete(
    () =>
      rescheduleBooking(admin, id, {
        staffId: formData.get("staffId"),
        date: formData.get("date"),
        time: formData.get("time"),
      }),
    `/admin/appointments/${encodeURIComponent(id)}/reschedule`,
    "Запись перенесена",
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";
import { requireRole } from "@/lib/auth/permissions";
import { setStaffBookingStatus } from "@/lib/booking/staff";

export async function setBookingStatusAction(formData: FormData) {
  const session = await requireRole(Role.STAFF);
  if (!session.user.staffProfileId) redirect("/sign-in");
  const view = formData.get("view") === "week" ? "week" : "today";
  const date = String(formData.get("date") || "");
  let location = `/staff?view=${view}&date=${encodeURIComponent(date)}`;
  try {
    await setStaffBookingStatus(
      {
        userId: session.user.id,
        organizationId: session.user.organizationId,
        staffProfileId: session.user.staffProfileId,
      },
      String(formData.get("id")),
      String(formData.get("status")),
    );
    revalidatePath("/staff");
    location += "&success=" + encodeURIComponent("Статус записи обновлён");
  } catch {
    location += "&error=" + encodeURIComponent("Не удалось изменить статус записи");
  }
  redirect(location);
}

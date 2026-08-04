import "server-only";

import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

export async function getVerifiedSession() {
  const session = await auth();
  if (!session?.user) return null;

  const currentUser = await getDb().user.findUnique({
    where: { id: session.user.id },
    select: {
      status: true,
      memberships: {
        where: { organizationId: session.user.organizationId },
        take: 1,
        select: { role: true },
      },
      staffProfile: { select: { id: true, isActive: true } },
    },
  });
  const membership = currentUser?.memberships[0];
  const validStaffProfile =
    membership?.role !== "STAFF" ||
    (currentUser?.staffProfile?.isActive === true &&
      currentUser.staffProfile.id === session.user.staffProfileId);

  if (
    !currentUser ||
    currentUser.status !== "ACTIVE" ||
    membership?.role !== session.user.role ||
    !validStaffProfile
  ) {
    return null;
  }

  return session;
}

export async function requireSession() {
  const session = await getVerifiedSession();
  if (!session) redirect("/sign-in");
  return session;
}

export async function requireRole(role: Role) {
  const session = await requireSession();

  if (session.user.role !== role) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/staff");
  }

  return session;
}

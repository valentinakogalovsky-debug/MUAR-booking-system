import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { getVerifiedSession } from "@/lib/auth/permissions";

export async function getStaffActor() {
  const session = await getVerifiedSession();
  if (!session) {
    return { response: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) };
  }
  if (session.user.role !== "STAFF" || !session.user.staffProfileId) {
    return { response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  }
  return {
    actor: {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      staffProfileId: session.user.staffProfileId,
    },
  };
}

export function staffApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  console.error("Staff API error", error);
  return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
}

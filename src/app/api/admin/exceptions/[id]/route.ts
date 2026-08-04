import { NextResponse } from "next/server";
import { removeException } from "@/lib/admin/schedule";
import { apiError, getAdminActor } from "@/lib/api/admin";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminActor();
  if (access.response) return access.response;
  try {
    const { id } = await params;
    await removeException(access.actor, id);
    return NextResponse.json({ result: "deleted" });
  } catch (error) {
    return apiError(error);
  }
}

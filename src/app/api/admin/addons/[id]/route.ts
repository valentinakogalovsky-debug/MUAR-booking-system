import { NextResponse } from "next/server";
import { removeAddon, updateAddon } from "@/lib/admin/catalog";
import { apiError, getAdminActor } from "@/lib/api/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminActor();
  if (access.response) return access.response;
  try {
    const { id } = await params;
    const addon = await updateAddon(access.actor, id, await request.json());
    return NextResponse.json({ addon });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminActor();
  if (access.response) return access.response;
  try {
    const { id } = await params;
    await removeAddon(access.actor, id);
    return NextResponse.json({ result: "deleted" });
  } catch (error) {
    return apiError(error);
  }
}

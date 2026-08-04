import { NextResponse } from "next/server";
import { removeService, updateService } from "@/lib/admin/catalog";
import { apiError, getAdminActor } from "@/lib/api/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminActor();
  if (access.response) return access.response;
  try {
    const { id } = await params;
    const service = await updateService(access.actor, id, await request.json());
    return NextResponse.json({ service });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminActor();
  if (access.response) return access.response;
  try {
    const { id } = await params;
    const result = await removeService(access.actor, id);
    return NextResponse.json({ result });
  } catch (error) {
    return apiError(error);
  }
}

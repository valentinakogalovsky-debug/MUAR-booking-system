import { NextResponse } from "next/server";
import { updateStaff } from "@/lib/admin/staff";
import { apiError, getAdminActor } from "@/lib/api/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminActor();
  if (access.response) return access.response;
  try {
    const { id } = await params;
    const staff = await updateStaff(access.actor, id, await request.json());
    return NextResponse.json({ staff });
  } catch (error) {
    return apiError(error);
  }
}

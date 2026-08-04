import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/admin/settings";
import { apiError, getAdminActor } from "@/lib/api/admin";

export async function GET() {
  const access = await getAdminActor();
  if (access.response) return access.response;
  return NextResponse.json({ settings: await getSettings(access.actor.organizationId) });
}

export async function PATCH(request: Request) {
  const access = await getAdminActor();
  if (access.response) return access.response;
  try {
    const settings = await updateSettings(access.actor, await request.json());
    return NextResponse.json({ settings });
  } catch (error) {
    return apiError(error);
  }
}

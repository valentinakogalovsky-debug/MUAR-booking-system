import { NextResponse } from "next/server";
import { createAddon, listCatalog } from "@/lib/admin/catalog";
import { apiError, getAdminActor } from "@/lib/api/admin";

export async function GET() {
  const access = await getAdminActor();
  if (access.response) return access.response;
  const { addons } = await listCatalog(access.actor.organizationId);
  return NextResponse.json({ addons });
}

export async function POST(request: Request) {
  const access = await getAdminActor();
  if (access.response) return access.response;
  try {
    const addon = await createAddon(access.actor, await request.json());
    return NextResponse.json({ addon }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

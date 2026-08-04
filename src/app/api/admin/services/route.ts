import { NextResponse } from "next/server";
import { createService, listCatalog } from "@/lib/admin/catalog";
import { apiError, getAdminActor } from "@/lib/api/admin";

export async function GET() {
  const access = await getAdminActor();
  if (access.response) return access.response;
  const { services } = await listCatalog(access.actor.organizationId);
  return NextResponse.json({ services });
}

export async function POST(request: Request) {
  const access = await getAdminActor();
  if (access.response) return access.response;
  try {
    const service = await createService(access.actor, await request.json());
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

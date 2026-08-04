import { NextResponse } from "next/server";
import { listAudit } from "@/lib/admin/staff";
import { getAdminActor } from "@/lib/api/admin";

export async function GET() {
  const access = await getAdminActor();
  if (access.response) return access.response;
  return NextResponse.json({ audit: await listAudit(access.actor.organizationId) });
}

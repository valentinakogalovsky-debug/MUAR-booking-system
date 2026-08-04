import { NextResponse } from "next/server";
import { createException, listUpcomingExceptions } from "@/lib/admin/schedule";
import { apiError, getAdminActor } from "@/lib/api/admin";
import { studioDate } from "@/lib/schedule/time";

export async function GET(request: Request) {
  const access = await getAdminActor();
  if (access.response) return access.response;
  const from =
    new URL(request.url).searchParams.get("from") || studioDate(new Date(), "Europe/Moscow");
  return NextResponse.json({
    exceptions: await listUpcomingExceptions(access.actor.organizationId, from),
  });
}

export async function POST(request: Request) {
  const access = await getAdminActor();
  if (access.response) return access.response;
  try {
    const exception = await createException(access.actor, await request.json());
    return NextResponse.json({ exception }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

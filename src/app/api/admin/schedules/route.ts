import { NextResponse } from "next/server";
import { getScheduleOverview } from "@/lib/admin/schedule";
import { getAdminActor } from "@/lib/api/admin";
import { studioDate } from "@/lib/schedule/time";

export async function GET(request: Request) {
  const access = await getAdminActor();
  if (access.response) return access.response;
  const date =
    new URL(request.url).searchParams.get("date") || studioDate(new Date(), "Europe/Moscow");
  return NextResponse.json(await getScheduleOverview(access.actor.organizationId, date));
}

import { NextResponse } from "next/server";
import { getStaffActor, staffApiError } from "@/lib/api/staff";
import { listStaffBookings } from "@/lib/booking/staff";
import { differenceInCalendarDays, parseDate } from "@/lib/schedule/time";

export async function GET(request: Request) {
  const access = await getStaffActor();
  if (access.response) return access.response;
  try {
    const query = new URL(request.url).searchParams;
    const from = parseDate(query.get("from") || "");
    const to = parseDate(query.get("to") || from);
    const days = differenceInCalendarDays(to, from) + 1;
    return NextResponse.json(await listStaffBookings(access.actor, from, days));
  } catch (error) {
    return staffApiError(error);
  }
}

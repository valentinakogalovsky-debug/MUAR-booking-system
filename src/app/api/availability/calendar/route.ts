import { NextResponse } from "next/server";
import { getAvailabilityCalendar } from "@/lib/availability/calendar-service";
import { AvailabilityError } from "@/lib/availability/service";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    return NextResponse.json(
      await getAvailabilityCalendar({
        serviceId: params.get("serviceId"),
        staffId: params.get("staffId") || undefined,
        month: params.get("month"),
      }),
    );
  } catch (error) {
    if (error instanceof AvailabilityError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: 400 });
    }
    console.error("Availability calendar API error", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

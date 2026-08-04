import { NextResponse } from "next/server";
import { AvailabilityError, getAvailability } from "@/lib/availability/service";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    return NextResponse.json(
      await getAvailability({
        serviceId: params.get("serviceId"),
        staffId: params.get("staffId") || undefined,
        date: params.get("date"),
      }),
    );
  } catch (error) {
    if (error instanceof AvailabilityError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: 400 });
    }
    console.error("Availability API error", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

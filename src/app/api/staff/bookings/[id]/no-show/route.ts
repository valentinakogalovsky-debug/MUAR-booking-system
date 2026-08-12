import { NextResponse } from "next/server";
import { getStaffActor, staffApiError } from "@/lib/api/staff";
import { BookingStateError } from "@/lib/booking/admin";
import { setStaffBookingStatus } from "@/lib/booking/staff";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getStaffActor();
  if (access.response) return access.response;
  try {
    const { id } = await params;
    return NextResponse.json({
      booking: await setStaffBookingStatus(access.actor, id, "NO_SHOW"),
    });
  } catch (error) {
    if (error instanceof BookingStateError) {
      return NextResponse.json(
        { error: "INVALID_STATUS", message: error.message },
        { status: 409 },
      );
    }
    return staffApiError(error);
  }
}

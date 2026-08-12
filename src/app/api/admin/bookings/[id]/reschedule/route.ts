import { NextResponse } from "next/server";
import { apiError, getAdminActor } from "@/lib/api/admin";
import { BookingStateError, rescheduleBooking } from "@/lib/booking/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminActor();
  if (access.response) return access.response;
  try {
    const { id } = await params;
    return NextResponse.json({
      booking: await rescheduleBooking(access.actor, id, await request.json()),
    });
  } catch (error) {
    if (error instanceof BookingStateError) {
      return NextResponse.json({ error: "SLOT_TAKEN", message: error.message }, { status: 409 });
    }
    return apiError(error);
  }
}

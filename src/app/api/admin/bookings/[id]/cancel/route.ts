import { NextResponse } from "next/server";
import { cancelBooking, BookingStateError } from "@/lib/booking/admin";
import { apiError, getAdminActor } from "@/lib/api/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getAdminActor();
  if (access.response) return access.response;
  try {
    const { id } = await params;
    return NextResponse.json({
      booking: await cancelBooking(access.actor, id, await request.json()),
    });
  } catch (error) {
    if (error instanceof BookingStateError) {
      return NextResponse.json(
        { error: "INVALID_STATUS", message: error.message },
        { status: 409 },
      );
    }
    return apiError(error);
  }
}

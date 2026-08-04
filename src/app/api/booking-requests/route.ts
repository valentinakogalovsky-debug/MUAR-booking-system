import { NextResponse } from "next/server";
import { BookingError, createBookingRequest } from "@/lib/booking/service";

export async function POST(request: Request) {
  try {
    const result = await createBookingRequest(
      await request.json(),
      request.headers.get("Idempotency-Key"),
    );
    return NextResponse.json(result.booking, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status },
      );
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
    console.error("Booking request API error", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

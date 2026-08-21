import { NextResponse } from "next/server";
import {
  bookingRequestClientKey,
  consumeBookingRequest,
  requestBodyIsTooLarge,
} from "@/lib/booking/request-security";
import { BookingError, createBookingRequest } from "@/lib/booking/service";

export async function POST(request: Request) {
  if (requestBodyIsTooLarge(request.headers)) {
    return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }
  const limit = consumeBookingRequest(bookingRequestClientKey(request.headers));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Слишком много заявок. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }
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

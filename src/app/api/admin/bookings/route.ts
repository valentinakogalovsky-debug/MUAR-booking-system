import { NextResponse } from "next/server";
import { getAdminActor } from "@/lib/api/admin";
import { BookingError, createBookingRequest } from "@/lib/booking/service";

export async function POST(request: Request) {
  const access = await getAdminActor();
  if (access.response) return access.response;
  try {
    const result = await createBookingRequest(
      await request.json(),
      request.headers.get("Idempotency-Key"),
      { actor: access.actor, source: "ADMIN" },
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
    console.error("Admin booking API error", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

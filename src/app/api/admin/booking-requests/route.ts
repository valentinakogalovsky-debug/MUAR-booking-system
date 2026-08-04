import { NextResponse } from "next/server";
import { listBookingRequests } from "@/lib/booking/admin";
import { apiError, getAdminActor } from "@/lib/api/admin";

export async function GET(request: Request) {
  const access = await getAdminActor();
  if (access.response) return access.response;
  try {
    const status = new URL(request.url).searchParams.get("status") || "PENDING";
    return NextResponse.json({
      requests: await listBookingRequests(access.actor.organizationId, status),
    });
  } catch (error) {
    return apiError(error);
  }
}

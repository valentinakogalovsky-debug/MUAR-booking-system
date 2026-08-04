import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const serviceId = new URL(request.url).searchParams.get("serviceId") ?? undefined;
  const staff = await getDb().staffProfile.findMany({
    where: {
      organization: { slug: "muare" },
      isActive: true,
      ...(serviceId ? { services: { some: { serviceId, service: { isActive: true } } } } : {}),
    },
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true, slug: true },
  });
  return NextResponse.json({ staff });
}

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/permissions";

export default async function ContinueAfterSignInPage() {
  const session = await requireSession();
  redirect(session.user.role === "ADMIN" ? "/admin" : "/staff");
}

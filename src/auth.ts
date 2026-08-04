import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { getDb } from "@/lib/db";
import { normalizePhone } from "@/lib/auth/phone";
import { clearLoginAttempts, consumeLoginAttempt } from "@/lib/auth/rate-limit";

const DUMMY_PASSWORD_HASH = "$2b$12$H2aiN8jrRrO1b6h8KaQ8fe6A1TVyhOfPNeQnQIP.6AJRwOh/iQ17u";

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/sign-in" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [
    Credentials({
      credentials: {
        phone: { label: "Телефон", type: "tel" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials, request) {
        const rawPhone = typeof credentials.phone === "string" ? credentials.phone : "";
        const password = typeof credentials.password === "string" ? credentials.password : "";
        const phone = normalizePhone(rawPhone);
        const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
        const clientAddress = forwardedFor || request.headers.get("x-real-ip") || "unknown";
        const rateLimitKey = `${clientAddress}:${phone ?? "invalid"}`;

        if (!consumeLoginAttempt(rateLimitKey) || !phone || !password) return null;

        const user = await getDb().user.findUnique({
          where: { phone },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            passwordHash: true,
            status: true,
            memberships: {
              take: 1,
              select: { organizationId: true, role: true },
            },
            staffProfile: { select: { id: true, isActive: true } },
          },
        });

        const passwordMatches = await compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
        const membership = user?.memberships[0];
        const activeStaff = membership?.role !== "STAFF" || user?.staffProfile?.isActive === true;

        if (!user || !passwordMatches || user.status !== "ACTIVE" || !membership || !activeStaff) {
          return null;
        }

        clearLoginAttempts(rateLimitKey);
        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          role: membership.role,
          organizationId: membership.organizationId,
          staffProfileId: user.staffProfile?.id ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.staffProfileId = user.staffProfileId;
      }
      return token;
    },
    session({ session, token }) {
      if (
        (token.role !== "ADMIN" && token.role !== "STAFF") ||
        typeof token.organizationId !== "string" ||
        (token.staffProfileId !== null && typeof token.staffProfileId !== "string")
      ) {
        throw new Error("Invalid authentication token");
      }

      session.user.id = token.sub ?? "";
      session.user.role = token.role;
      session.user.organizationId = token.organizationId;
      session.user.staffProfileId = token.staffProfileId;
      return session;
    },
  },
});

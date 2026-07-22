import type { NextAuthConfig } from "next-auth";

const SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
if (process.env.NODE_ENV === "production" && !SECRET) {
  throw new Error(
    "Missing AUTH_SECRET or NEXTAUTH_SECRET. Set a 32+ byte hex secret in your Vercel project environment variables. Example: openssl rand -hex 32",
  );
}

export const authConfig = {
  secret: SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;

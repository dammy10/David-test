import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { z } from "zod";
import type { User } from "@/app/lib/definitions";
import bcrypt from "bcrypt";
import postgres from "postgres";

// Reuse a single Postgres client across reloads to avoid exhausting DB
// connections during dev/hot-reload or multiple server workers.
const globalPg = globalThis as unknown as { __pg_auth_sql?: any };
const sql =
  globalPg.__pg_auth_sql ??
  (globalPg.__pg_auth_sql = postgres(process.env.POSTGRES_URL!, {
    ssl: "require",
    max: 4,
  }));

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function getUser(email: string): Promise<User | null> {
  try {
    console.log("auths.getUser: loading user", email);
    const rows = await sql<User[]>`
      SELECT id, name, email, password
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;
    const user = rows[0] ?? null;
    console.log("auths.getUser: result", !!user);
    return user;
  } catch (error) {
    console.error("Failed to load user", error);
    return null;
  }
}

const handlers = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = CredentialsSchema.safeParse(credentials);
        if (!parsedCredentials.success) {
          console.log("auths.authorize: invalid payload", credentials);
          return null;
        }

        const { email, password } = parsedCredentials.data;
        const user = await getUser(email);
        if (!user) {
          console.log("auths.authorize: user not found", email);
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);
        console.log("auths.authorize: passwordsMatch", passwordsMatch);
        if (passwordsMatch) return user;

        console.log("auths.authorize: invalid credentials for", email);
        return null;
      },
    }),
  ],
});

// `handlers` is a function that handles App Router requests. It also exposes
// helpers like `signIn`/`signOut` on the returned object in Auth.js v5.
const maybeHandlers = handlers as any;
export const auth = maybeHandlers;
export const signIn = maybeHandlers.signIn;
export const signOut = maybeHandlers.signOut;

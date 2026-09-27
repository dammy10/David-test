import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { authConfig } from "@/auth.config";
import type { NextAuthConfig } from "next-auth";
import { z } from "zod";
import type { User } from "@/app/lib/definitions";
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import postgres from "postgres";
import { getOAuthProviderCredentials } from "@/app/lib/auth-providers";

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

const providers: NonNullable<NextAuthConfig["providers"]> = [
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
];

const githubCredentials = getOAuthProviderCredentials("github");
if (githubCredentials) providers.push(GitHub(githubCredentials));

const googleCredentials = getOAuthProviderCredentials("google");
if (googleCredentials) providers.push(Google(googleCredentials));

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

async function ensureOAuthUser(
  email: string,
  name: string | null | undefined,
) {
  const existingUsers = await sql<{ email: string }[]>`
    SELECT email
    FROM users
    WHERE LOWER(email) = ${email}
    LIMIT 1
  `;

  if (existingUsers.length > 0) return true;

  const password = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  const displayName = name?.trim() || email.split("@")[0];

  await sql`
    INSERT INTO users (name, email, password)
    VALUES (${displayName}, ${email}, ${password})
    ON CONFLICT (email) DO NOTHING
  `;

  const createdUsers = await sql<{ email: string }[]>`
    SELECT email
    FROM users
    WHERE LOWER(email) = ${email}
    LIMIT 1
  `;

  return createdUsers.length > 0;
}

async function isVerifiedGitHubEmail(email: string, accessToken: string) {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    console.error("Failed to verify GitHub email:", response.status);
    return false;
  }

  const emails = z
    .array(
      z.object({
        email: z.string().email(),
        primary: z.boolean(),
        verified: z.boolean(),
      }),
    )
    .safeParse(await response.json());

  if (!emails.success) {
    console.error("GitHub returned an invalid email verification response.");
    return false;
  }

  return emails.data.some(
    (entry) =>
      entry.primary &&
      entry.verified &&
      entry.email.toLowerCase() === email.toLowerCase(),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile, user }) {
      if (account?.provider === "credentials") return true;
      if (!account || !user.email) return false;

      const email = user.email.trim().toLowerCase();

      if (account.provider === "google") {
        const googleProfile = z
          .object({
            email: z.string().email(),
            email_verified: z.literal(true),
          })
          .safeParse(profile);

        if (
          !googleProfile.success ||
          googleProfile.data.email.toLowerCase() !== email
        ) {
          console.warn("OAuth sign-in denied: Google email is not verified.");
          return false;
        }
      } else if (account.provider === "github") {
        if (
          !account.access_token ||
          !(await isVerifiedGitHubEmail(email, account.access_token))
        ) {
          console.warn("OAuth sign-in denied: GitHub email is not verified.");
          return false;
        }
      } else {
        return false;
      }

      return ensureOAuthUser(email, user.name);
    },
  },
});

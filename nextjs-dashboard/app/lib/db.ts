import postgres from "postgres";

const globalForDb = globalThis as typeof globalThis & {
  __shared_sql?: ReturnType<typeof postgres>;
};

export const sql =
  globalForDb.__shared_sql ??
  (globalForDb.__shared_sql = postgres(process.env.POSTGRES_URL!, {
    ssl: "require",
    max: 2,
    idle_timeout: 10,
    connect_timeout: 10,
  }));
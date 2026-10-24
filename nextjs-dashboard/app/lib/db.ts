import postgres from "postgres";

const databaseEndpoint = new URL(process.env.POSTGRES_URL!);

console.log("Database endpoint:", {
  host: databaseEndpoint.hostname,
  port: databaseEndpoint.port || "5432",
});
const globalForDb = globalThis as typeof globalThis & {
  __shared_sql?: ReturnType<typeof postgres>;
};

export const sql =
  globalForDb.__shared_sql ??
  (globalForDb.__shared_sql = postgres(process.env.POSTGRES_URL!, {
    ssl: "require",
    prepare: false,
    max: 1,
    // Reuse warm connections across brief pauses between page visits.
    idle_timeout: 60,
    connect_timeout: 10,
  }));

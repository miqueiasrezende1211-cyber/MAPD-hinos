import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

function buildPoolConfig(connectionString: string): pg.PoolConfig {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");
  const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

  if (sslMode === "disable" || (sslMode === null && isLocalHost)) {
    return { connectionString };
  }

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    ssl: {
      rejectUnauthorized: false,
    },
  };
}

export const pool = new Pool(buildPoolConfig(databaseUrl));
export const db = drizzle(pool, { schema });

export * from "./schema";

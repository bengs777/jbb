import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Singleton pattern: prevents multiple connections during Next.js hot-reload in dev
const globalForDb = globalThis as unknown as {
  _libsqlClient: ReturnType<typeof createClient> | undefined;
};

const client =
  globalForDb._libsqlClient ??
  createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb._libsqlClient = client;
}

export const db = drizzle(client, { schema });
export type DB = typeof db;

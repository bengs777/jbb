import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client/web";
import * as schema from "./schema";

// Initialize Turso database connection using environment variables
// The TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are provided at runtime
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Export the drizzle instance for use throughout the application
export const db = drizzle(turso, { schema });

export type Database = typeof db;

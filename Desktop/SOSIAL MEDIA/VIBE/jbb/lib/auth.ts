import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";

// Initialize Better Auth with the database connection and admin plugin
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: schema,
  }),

  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Trusted origins for CORS and security
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.NEXT_PUBLIC_APP_URL || "",
    "https://*.vercel.run",
  ].filter(Boolean),

  // Email and password authentication (no email verification required)
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  // Admin plugin for role-based access control
  plugins: [admin()],
});

export type Auth = typeof auth;

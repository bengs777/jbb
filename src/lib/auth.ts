import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 6,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  cookies: {
    sessionToken: {
      name: "jbb_session",
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    },
  },
  // Map additional user fields
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "BUYER",
        required: false,
      },
      is_active: {
        type: "boolean",
        defaultValue: true,
        required: false,
      },
      password_hash: {
        type: "string",
        required: false,
      },
      alamat: {
        type: "string",
        required: false,
      },
      no_hp: {
        type: "string",
        required: false,
      },
    },
  },
  // Ensure every new user (including Google OAuth) gets proper defaults
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              role: user.role || "BUYER",
              is_active: user.is_active != null ? user.is_active : true,
            },
          };
        },
      },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  trustedOrigins:
    process.env.NODE_ENV === "production"
      ? [process.env.BETTER_AUTH_URL!]
      : [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
        ],
});

export type Session = typeof auth.$Infer.Session;

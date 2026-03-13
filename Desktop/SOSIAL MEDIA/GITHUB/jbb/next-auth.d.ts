import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      role?: string | null;
    } & DefaultSession["user"]
  }

  interface User {
    role?: string | null;
  }
}

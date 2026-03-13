"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [adminClient()],
});

// Export commonly used auth methods
export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient;

// Admin methods available via authClient.admin
// - authClient.admin.setRole({ userId, role })
// - authClient.admin.banUser({ userId, reason })
// - authClient.admin.unbanUser({ userId })
// - authClient.admin.impersonateUser({ userId })

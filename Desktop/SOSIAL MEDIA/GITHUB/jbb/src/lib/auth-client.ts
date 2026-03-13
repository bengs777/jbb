import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // In the browser, always use the current page's origin so the auth API call
  // hits the exact port the dev server is running on (avoids SSL errors when
  // Next.js auto-switches from 3000 → 3001).
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
});

export const { signIn, signOut, signUp, useSession } = authClient;

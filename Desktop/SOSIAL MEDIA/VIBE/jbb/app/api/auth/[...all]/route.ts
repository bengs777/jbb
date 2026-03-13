import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Better Auth API route handler for Next.js
export const { GET, POST } = toNextJsHandler(auth);

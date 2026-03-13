import { NextRequest, NextResponse } from "next/server";

export type UserRole = "BUYER" | "SELLER" | "KURIR" | "ADMIN";

export interface RequestUser {
  id: string;
  role: UserRole;
  email: string;
}

// Extract user from headers set by middleware
export function getUserFromRequest(req: NextRequest): RequestUser | null {
  const id = req.headers.get("x-user-id");
  const email = req.headers.get("x-user-email");
  // Default to BUYER if role header is missing/empty (e.g. new Google OAuth users)
  const rawRole = req.headers.get("x-user-role");
  const role = (rawRole && ["BUYER", "SELLER", "KURIR", "ADMIN"].includes(rawRole)
    ? rawRole
    : "BUYER") as UserRole;

  if (!id) return null;
  return { id, role, email: email ?? "" };
}

// Guard: require any authenticated user (any role)
export function requireAuth(
  req: NextRequest
): { user: RequestUser } | NextResponse {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { user };
}

// Guard: allow only specific roles
export function requireRole(
  req: NextRequest,
  ...allowedRoles: UserRole[]
): { user: RequestUser } | NextResponse {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: `Akses ditolak. Role ${user.role} tidak diizinkan.` },
      { status: 403 }
    );
  }
  return { user };
}

// Standard JSON response helpers
export function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// Rate limiting store (in-memory, per instance)
const rateLimitStore = new Map<string, { count: number; reset: number }>();

// Periodically purge expired entries to prevent unbounded memory growth
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.reset) rateLimitStore.delete(key);
    }
  }, 60_000);
}

export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.reset) {
    rateLimitStore.set(key, { count: 1, reset: now + windowMs });
    return true; // allowed
  }

  if (entry.count >= limit) {
    return false; // blocked
  }

  entry.count++;
  return true; // allowed
}

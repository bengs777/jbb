import { NextRequest, NextResponse } from "next/server";

// ─── NO imports from @/lib/auth — that pulls in better-auth which uses eval ───
// All session verification is done via cookie cache or plain fetch().

// ─── Types ───────────────────────────────────────────────────────
interface CachedUser {
  id: string;
  role: string;
  email: string;
  is_active: boolean;
}

// ─── Fast path: read session from cookie cache (no DB hit) ───────
function getSessionFromCache(req: NextRequest): CachedUser | null {
  try {
    const raw = req.cookies.get("jbb_session_data")?.value;
    if (!raw) return null;
    const decoded = atob(raw);
    const data = JSON.parse(decoded);
    if (!data?.user?.id) return null;
    return {
      id: data.user.id,
      role:
        data.user.role &&
        ["BUYER", "SELLER", "KURIR", "ADMIN"].includes(data.user.role)
          ? data.user.role
          : "BUYER",
      email: data.user.email ?? "",
      is_active:
        data.user.is_active === 0
          ? false
          : Boolean(data.user.is_active ?? true),
    };
  } catch {
    return null;
  }
}

// Public routes (no auth needed)
const publicPaths = [
  "/",
  "/login",
  "/register",
  "/katalog",
  "/games",
  "/wifi",
  "/api/auth",
  "/api/products",
  "/api/payment/webhook",
  "/api/topup/webhook/mayar",
  "/api/games/webhook/mayar",
  "/api/games/order",
  "/api/games/products",
  "/api/games/status",
  "/api/wifi/order",
  "/api/wifi/status",
  "/api/payment/sandbox",
];

// Shared helper: block inactive SELLER/KURIR from their own role routes
function blockInactiveSellerKurir(
  pathname: string,
  role: string,
  isActive: boolean | undefined | null,
  requestUrl: string
): NextResponse | null {
  if (
    isActive !== false ||
    (role !== "SELLER" && role !== "KURIR")
  )
    return null;

  const isSellerKurirPath =
    pathname.startsWith("/seller") ||
    pathname.startsWith("/kurir") ||
    pathname.startsWith("/api/seller") ||
    pathname.startsWith("/api/kurir");

  if (!isSellerKurirPath) return null;

  if (pathname.startsWith("/api/"))
    return NextResponse.json(
      { error: "Akun belum diaktifkan oleh admin" },
      { status: 403 }
    );
  return NextResponse.redirect(new URL("/login?error=inactive", requestUrl));
}

// Shared helper: attach user identity headers
function withUserHeaders(
  request: NextRequest,
  id: string,
  role: string,
  email: string
) {
  const headers = new Headers(request.headers);
  headers.set("x-user-id", id);
  headers.set("x-user-role", role);
  headers.set("x-user-email", email);
  return NextResponse.next({ request: { headers } });
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  const isPublic = publicPaths.some((p) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p)
  );
  if (isPublic) return NextResponse.next();

  // Check authentication via session cookie
  const sessionToken =
    request.cookies.get("jbb_session")?.value ??
    request.cookies.get("better-auth.session_token")?.value;

  if (!sessionToken) {
    if (pathname.startsWith("/api/"))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Fast path: try cookie cache first (zero DB hits)
  const cached = getSessionFromCache(request);
  if (cached) {
    const blocked = blockInactiveSellerKurir(
      pathname,
      cached.role,
      cached.is_active,
      request.url
    );
    if (blocked) return blocked;
    return withUserHeaders(request, cached.id, cached.role, cached.email);
  }

  // Slow path: verify session via HTTP call to our own API (no direct auth import)
  try {
    const origin = request.nextUrl.origin;
    const res = await fetch(`${origin}/api/auth/get-session`, {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    });

    if (!res.ok) {
      if (pathname.startsWith("/api/"))
        return NextResponse.json(
          { error: "Session tidak valid" },
          { status: 401 }
        );
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const session = await res.json();

    if (!session?.user?.id) {
      if (pathname.startsWith("/api/"))
        return NextResponse.json(
          { error: "Session tidak valid" },
          { status: 401 }
        );
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const userRole: string = session.user.role ?? "BUYER";
    const isActive: boolean =
      session.user.is_active === 0
        ? false
        : Boolean(session.user.is_active ?? true);

    const blocked = blockInactiveSellerKurir(
      pathname,
      userRole,
      isActive,
      request.url
    );
    if (blocked) return blocked;

    return withUserHeaders(
      request,
      session.user.id,
      userRole,
      session.user.email
    );
  } catch {
    if (pathname.startsWith("/api/"))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

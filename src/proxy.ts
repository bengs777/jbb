import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Routes that require authentication (redirect to /login if not logged in)
const PROTECTED_ROUTES = [
  "/admin",
  "/buyer/cart",
  "/buyer/orders",
  "/buyer/payment",
  "/seller",
  "/kurir",
  "/settings",
  "/topup/deposit",
  "/topup/history",
  "/topup/order",
];

// API routes that need auth headers populated (but NOT redirected — let the route handle 401)
const AUTH_HEADER_ROUTES = ["/api/"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only run session lookup for protected pages and API routes
  const needsSession =
    AUTH_HEADER_ROUTES.some((p) => pathname.startsWith(p)) ||
    PROTECTED_ROUTES.some((p) => pathname.startsWith(p));

  if (!needsSession) {
    return NextResponse.next();
  }

  // Fetch session from Better Auth
  let session: Awaited<ReturnType<typeof auth.api.getSession>> = null;
  try {
    session = await auth.api.getSession({ headers: req.headers });
  } catch {
    // Session lookup failure — treat as unauthenticated
  }

  const isProtectedPage = PROTECTED_ROUTES.some((p) => pathname.startsWith(p));
  const isApiRoute = pathname.startsWith("/api/");

  // Redirect unauthenticated users away from protected pages
  if (isProtectedPage && !session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For API routes (and authenticated page routes): forward user info in headers
  const res = NextResponse.next();

  if (session?.user) {
    res.headers.set("x-user-id", session.user.id);
    res.headers.set("x-user-email", session.user.email ?? "");
    res.headers.set("x-user-role", (session.user as { role?: string }).role ?? "BUYER");
  }

  // Block inactive users from protected pages
  if (isProtectedPage && session?.user) {
    const userRecord = session.user as { is_active?: boolean; role?: string };
    if (userRecord.is_active === false) {
      return NextResponse.redirect(new URL("/login?error=inactive", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - _next/static (static files)
     *  - _next/image (image optimization)
     *  - favicon.ico
     *  - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths
  const publicPaths = ["/", "/login", "/register", "/api/auth"];
  const isPublic = publicPaths.some(
    (p) => p === "/" ? pathname === "/" : pathname.startsWith(p)
  );

  if (isPublic) {
    return NextResponse.next();
  }

  // Check session
  const sessionToken =
    request.cookies.get("jbb_session")?.value ||
    request.cookies.get("better-auth.session_token")?.value;

  if (!sessionToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // User authenticated
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


const forbiddenRoles = ['seller', 'user', 'kurir'];

function decodeBase64JsonSession(sessionCookie) {
  if (!sessionCookie) return null;
  try {
    // Jika session cookie adalah base64-encoded JSON
    const json = Buffer.from(sessionCookie, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/games') || pathname.startsWith('/topup')) {
    const sessionCookie = request.cookies.get('jbb_session')?.value;
    const session = decodeBase64JsonSession(sessionCookie);
    const role = session?.role;
    // Blokir SEMUA user (termasuk guest/tanpa session) dan role forbidden
    if (!role || forbiddenRoles.includes(role.toLowerCase())) {
      const url = request.nextUrl.clone();
      url.pathname = '/forbidden';
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/games/:path*', '/topup/:path*'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Full security is handled via Firebase Rules and API token verification.
// Client-side role checks and server-side API verification are the primary guards.
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Redirect old /login route to /register — login page no longer exists
  if (path === '/login') {
    return NextResponse.redirect(new URL('/register', request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login'],
};

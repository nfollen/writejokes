import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/write', '/history', '/setlists', '/stats', '/settings'];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/login'];

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Get session from cookie (simplified check)
  const hasSession = request.cookies.has('sb-access-token') || 
                     request.cookies.getAll().some(c => c.name.includes('supabase'));

  // Redirect unauthenticated users from protected routes to login
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    // Note: Full auth check happens in AuthGuard component
    return response;
  }

  // Redirect authenticated users from auth routes to dashboard
  if (authRoutes.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
};

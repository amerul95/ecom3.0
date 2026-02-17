import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth();
  
  // Protect /crm routes
  if (request.nextUrl.pathname.startsWith("/crm")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  
  // Protect /admin routes - require ADMIN role
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Check if user has ADMIN role
    if (session.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
  }
  
  // Protect API routes (handled in route handlers, but can add middleware here too)
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/crm/:path*",
    "/admin/:path*",
    // API routes are protected in their handlers
  ],
};


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
  
  // Protect /seller routes - require SELLER role
  if (request.nextUrl.pathname.startsWith("/seller")) {
    if (!session) {
      return NextResponse.redirect(new URL("/seller/login", request.url));
    }
    // Check if user has SELLER role
    if (session.user?.role !== "SELLER") {
      return NextResponse.redirect(new URL("/seller/login?error=unauthorized", request.url));
    }
  }

  // Redirect BUYER role users away from seller routes
  // Redirect SELLER role users away from buyer login
  if (request.nextUrl.pathname === "/login" && session?.user?.role === "SELLER") {
    return NextResponse.redirect(new URL("/seller/login", request.url));
  }
  
  if (request.nextUrl.pathname === "/seller/login" && session?.user?.role === "BUYER") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Protect API routes (handled in route handlers, but can add middleware here too)
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/crm/:path*",
    "/seller/dashboard/:path*",
    // API routes are protected in their handlers
  ],
};


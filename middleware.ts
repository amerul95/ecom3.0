import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Protect /admin routes - require ADMIN role (authorized callback handles auth)
    if (req.nextUrl.pathname.startsWith("/admin")) {
      const token = req.nextauth.token as { role?: string } | null;
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/crm/:path*", "/admin/:path*"],
};

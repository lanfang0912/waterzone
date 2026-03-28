import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(_req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 登入頁不需要驗證
        if (req.nextUrl.pathname === "/admin/login") return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};

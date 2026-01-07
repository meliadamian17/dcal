import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const isCronRoute = req.nextUrl.pathname.startsWith("/api/cron");
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isPublicFile = /\.(.*)$/.test(req.nextUrl.pathname); // Simple check for files

  if (isAuthRoute || isCronRoute || isPublicFile) {
    return;
  }

  if (isLoginPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/", req.nextUrl));
    }
    return;
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

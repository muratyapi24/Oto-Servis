import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import * as Sentry from "@sentry/nextjs";
import { checkRateLimit } from "./lib/rate-limit";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1";

  const pathname = req.nextUrl.pathname;

  // Rate limit kontrolü (sadece API ve login rotaları için)
  if (pathname.startsWith("/api/") || pathname.startsWith("/login")) {
    const rateLimitResult = await checkRateLimit(ip, pathname);

    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({ error: "Çok fazla istek. Lütfen daha sonra tekrar deneyin." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "Retry-After": String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }
  }

  // Sentry tenant tag
  const session = req.auth;
  const tenantId = session?.user?.tenantId;
  if (tenantId) {
    Sentry.setTag("tenantId", tenantId);
  }

  // Subscription Guard — Dashboard rotalarında tenant durumunu kontrol et
  // Not: Edge Runtime'da Prisma doğrudan kullanılamaz;
  // asıl detaylı kontroller server component ve server action katmanında yapılır.
  if (
    session?.user &&
    tenantId &&
    pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/dashboard/subscription-blocked")
  ) {
    const tenantStatus = session.user.tenantStatus;
    const subscriptionStatus = session.user.subscriptionStatus;

    if (tenantStatus === "SUSPENDED" || tenantStatus === "DELETED") {
      const blockedUrl = new URL("/dashboard/subscription-blocked", req.url);
      blockedUrl.searchParams.set("reason", tenantStatus.toLowerCase());
      return NextResponse.redirect(blockedUrl);
    }

    if (
      (subscriptionStatus === "EXPIRED" || subscriptionStatus === "CANCELLED") &&
      !pathname.startsWith("/dashboard/settings")
    ) {
      const blockedUrl = new URL("/dashboard/subscription-blocked", req.url);
      blockedUrl.searchParams.set("reason", "expired");
      return NextResponse.redirect(blockedUrl);
    }
  }

  // Locale detection — Accept-Language header'dan locale belirle
  const localeCookie = req.cookies.get("locale")?.value;
  if (!localeCookie) {
    const acceptLanguage = req.headers.get("accept-language") ?? "";
    const preferredLocale = acceptLanguage.startsWith("en") ? "en" : "tr";
    const response = NextResponse.next();
    response.cookies.set("locale", preferredLocale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
    return response;
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
};

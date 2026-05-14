import { canAccess } from "./lib/permissions";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }: { auth: any; request: { nextUrl: URL } }) {
      const isLoggedIn = !!auth?.user;
      const isSuperAdminPath = nextUrl.pathname.startsWith("/super-admin");
      const isDashboardPath = nextUrl.pathname.startsWith("/dashboard");
      const isMobilePath = nextUrl.pathname === "/m" || nextUrl.pathname.startsWith("/m/");
      const isMusteriPath = nextUrl.pathname.startsWith("/m/musteri");
      
      if (isSuperAdminPath) {
        if (nextUrl.pathname === "/superadmin-login") return true;
        if (isLoggedIn) return true;
        return Response.redirect(new URL("/superadmin-login", nextUrl));
      }

      if (isDashboardPath || isMobilePath) {
        // Login sayfalarına şartsız izin ver (redirect loop önlemi)
        if (nextUrl.pathname.endsWith("/login")) return true;

        if (!isLoggedIn) {
            // Dashboard paths
            if (isDashboardPath) return false; // varsayılan signin'e atar
            // Mobile paths handling
            if (isMusteriPath) return Response.redirect(new URL("/m/musteri/login", nextUrl));
            if (isMobilePath && !isMusteriPath) return Response.redirect(new URL("/m/firma/login", nextUrl));
            return false;
        }

        const role = auth?.user?.role;

        // Rol bilgisi yoksa (middleware token'da mevcut değilse),
        // giriş yapmış kullanıcıya izin ver — RBAC client-side'da (Sidebar/NavBar) uygulanır
        if (!role) return true;

        const allowed = canAccess(role, nextUrl.pathname);

        if (!allowed) {
            // Aynı yola yönlendirme yapma (sonsuz döngü önlemi)
            if (nextUrl.pathname === "/dashboard") return true;
            
            if (role === "SUPER_ADMIN") return Response.redirect(new URL("/super-admin", nextUrl));
            if (role === "CUSTOMER") return Response.redirect(new URL("/m/musteri/panel", nextUrl));
            
            if (isMobilePath && !isMusteriPath) {
                return Response.redirect(new URL("/m/firma/panel", nextUrl));
            }
            return Response.redirect(new URL("/dashboard", nextUrl));
        }

        return true;
      }
      
      return true;
    },
  },
  providers: [],
};

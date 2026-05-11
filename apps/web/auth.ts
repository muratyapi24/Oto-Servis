import NextAuth, { type NextAuthResult } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@repo/database";
import { authConfig } from "./auth.config";
import { loginSchema } from "./lib/validations/auth";

export const { handlers, auth, signIn, signOut }: NextAuthResult = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials);
        if (!validatedFields.success) return null;

        const { email, password } = validatedFields.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as "SUPER_ADMIN" | "TENANT_ADMIN" | "MECHANIC" | "RECEPTIONIST" | "ACCOUNTANT",
          tenantId: user.tenantId ?? undefined,
          requiresTwoFactor: user.hasTwoFactor,
        };
      }
    }),
    CredentialsProvider({
      id: "customer",
      name: "Customer Portal",
      credentials: {
        plate: { label: "Plaka", type: "text" },
        phone: { label: "Telefon Numarası", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.plate || !credentials?.phone) return null;

        const queryPlate = (credentials.plate as string).replace(/\s+/g, '').toUpperCase();
        const queryPhone = (credentials.phone as string).replace(/\s+/g, '');

        const vehicles = await prisma.vehicle.findMany({
          where: { customer: { phone: { contains: queryPhone } } },
          include: { customer: true }
        });

        const vehicle = vehicles.find(
          v => v.plate.replace(/\s+/g, '').toUpperCase() === queryPlate
        );

        if (!vehicle) return null;

        return {
          id: vehicle.customer.id,
          name: vehicle.customer.type === "CORPORATE"
            ? vehicle.customer.companyName ?? vehicle.customer.id
            : `${vehicle.customer.firstName ?? ''} ${vehicle.customer.lastName ?? ''}`.trim(),
          email: vehicle.plate,
          role: "CUSTOMER" as const,
          tenantId: vehicle.tenantId,
        };
      }
    })
  ],
  // @ts-expect-error — @auth/core version mismatch between next-auth@5-beta and @auth/prisma-adapter; works at runtime
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        // JWT extends Record<string, unknown> — bracket notation required for custom fields
        token["role"] = user.role;
        token["tenantId"] = user.tenantId;
        token["plate"] = user.email ?? undefined;
        token["requiresTwoFactor"] = user.requiresTwoFactor ?? false;
        token["twoFactorVerified"] = false;
        // next-auth v5 uses token.sub for user ID; also store for back-compat
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token["role"] ?? "MECHANIC") as "SUPER_ADMIN" | "TENANT_ADMIN" | "MECHANIC" | "RECEPTIONIST" | "ACCOUNTANT" | "CUSTOMER";
        session.user.tenantId = token["tenantId"] as string | undefined;
        session.user.plate = token["plate"] as string | undefined;
        session.user.requiresTwoFactor = token["requiresTwoFactor"] as boolean | undefined;
        session.user.twoFactorVerified = token["twoFactorVerified"] as boolean | undefined;
      }
      return session;
    },
  },
});

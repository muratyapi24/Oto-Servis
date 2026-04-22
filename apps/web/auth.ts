// @ts-nocheck
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@repo/database";
import { authConfig } from "./auth.config";
import { loginSchema } from "./lib/validations/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
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

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            // 2FA kontrolü: hasTwoFactor aktifse session'a flag ekle
            // Gerçek 2FA doğrulaması /api/auth/2fa/verify endpoint'inde yapılır
            return {
              ...user,
              requiresTwoFactor: user.hasTwoFactor,
            } as any;
          }
        }

        return null; // return null to show error
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
          where: {
            customer: {
              phone: { contains: queryPhone }
            }
          },
          include: { customer: true }
        });

        // Veritabanındaki boşluklu plakalarla (örn. "34 A 100"), kullanıcının girdiği bitişik ("34A100") formatını eşleştirir
        const vehicle = vehicles.find(v => v.plate.replace(/\s+/g, '').toUpperCase() === queryPlate);

        if (vehicle) {
          return {
            id: vehicle.customer.id,
            name: vehicle.customer.type === "CORPORATE" ? vehicle.customer.companyName : `${vehicle.customer.firstName} ${vehicle.customer.lastName}`,
            email: vehicle.plate, // Store plate as email since email might be null for customers
            role: "CUSTOMER", // virtual role
            tenantId: vehicle.tenantId
          } as any;
        }

        return null;
      }
    })
  ],
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = (user as any).tenantId; 
        token.plate = user.email; // we mapped plate to email in customer auth
        token.requiresTwoFactor = (user as any).requiresTwoFactor ?? false;
        token.twoFactorVerified = false;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).plate = token.plate;
        (session.user as any).requiresTwoFactor = token.requiresTwoFactor;
        (session.user as any).twoFactorVerified = token.twoFactorVerified;
      }
      return session;
    },
  },
});

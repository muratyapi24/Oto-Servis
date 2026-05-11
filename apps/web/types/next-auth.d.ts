// export {} makes this a module file so declare module blocks become augmentations,
// not ambient replacements. Without it, declare module would erase NextAuth's own exports.
export {};

declare module "next-auth" {
  type AppRole =
    | "SUPER_ADMIN"
    | "TENANT_ADMIN"
    | "MECHANIC"
    | "RECEPTIONIST"
    | "ACCOUNTANT"
    | "CUSTOMER";

  interface Session {
    user: {
      id: string;
      role: AppRole;
      tenantId?: string;
      plate?: string;
      requiresTwoFactor?: boolean;
      twoFactorVerified?: boolean;
      tenantStatus?: string;
      subscriptionStatus?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: AppRole;
    tenantId?: string;
    plate?: string;
    requiresTwoFactor?: boolean;
    twoFactorVerified?: boolean;
  }
}

declare module "next-auth/jwt" {
  type AppRole =
    | "SUPER_ADMIN"
    | "TENANT_ADMIN"
    | "MECHANIC"
    | "RECEPTIONIST"
    | "ACCOUNTANT"
    | "CUSTOMER";

  interface JWT {
    id?: string;
    role?: AppRole;
    tenantId?: string;
    plate?: string;
    requiresTwoFactor?: boolean;
    twoFactorVerified?: boolean;
    tenantStatus?: string;
    subscriptionStatus?: string;
  }
}

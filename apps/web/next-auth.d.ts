import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's role. */
      role: "SUPER_ADMIN" | "TENANT_ADMIN" | "MECHANIC" | "RECEPTIONIST" | "ACCOUNTANT";
    } & DefaultSession["user"];
  }

  interface User {
    role: "SUPER_ADMIN" | "TENANT_ADMIN" | "MECHANIC" | "RECEPTIONIST" | "ACCOUNTANT";
  }
}

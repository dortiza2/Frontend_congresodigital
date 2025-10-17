import NextAuth, { DefaultSession, User as NextAuthUser } from "next-auth";
import type { AdapterUser as NextAuthAdapterUser } from "next-auth/adapters";

declare module "next-auth" {
  interface User extends NextAuthUser {
    backendData?: unknown;
  }

  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      backendId?: string;
      backendToken?: string;
      organization?: string;
      roles?: string[];
      roleLevel?: number;
      roleCodes?: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser extends NextAuthAdapterUser {
    backendData?: unknown;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    backendId?: string;
    backendToken?: string;
    organization?: string;
    roles?: string[];
    roleLevel?: number;
    roleCodes?: string[];
    backendData?: unknown;
  }
}
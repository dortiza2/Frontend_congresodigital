import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    organization?: string
    roles?: string[]
    roleLevel?: number
    roleCodes?: string[]
    backendData?: any
    backendId?: string
    backendToken?: string
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      organization?: string
      roles?: string[]
      roleLevel?: number
      roleCodes?: string[]
      backendId?: string
      backendToken?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
    organization?: string
    roles?: string[]
    roleLevel?: number
    roleCodes?: string[]
    backendId?: string
    backendToken?: string
  }
}
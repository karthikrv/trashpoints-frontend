/// <reference types="next-auth" />
/// <reference types="next-auth/jwt" />

declare module "next-auth" {
  interface Session {
    provider?: string;
    providerAccountId?: string;
    role?: string;
    isAuthorised: boolean
    user: {
      id?: string;
    } & import("next-auth").DefaultSession["user"]; // Inline import handles this cleanly
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    provider?: string;
    providerAccountId?: string;
    role?: string;
    isAuthorised: boolean
  }
}

export { };


import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accountId: string;
    userId: string;
  }
  interface User {
    id: string;
    accountId: string;
    email: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accountId: string;
    userId: string;
  }
}

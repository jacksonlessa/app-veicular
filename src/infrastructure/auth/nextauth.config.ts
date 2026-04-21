import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Email } from "@/domain/shared/value-objects/email.vo";
import { userRepository, hasher } from "@/infrastructure/container";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        try {
          const email = Email.create(creds?.email ?? "");
          const user = await userRepository.findByEmail(email);
          if (!user) return null;
          const ok = await hasher.verify(user.passwordHash, creds!.password ?? "");
          return ok
            ? { id: user.id, email: user.email.value, accountId: user.accountId }
            : null;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.accountId = user.accountId;
      }
      return token;
    },
    async session({ session, token }) {
      session.userId = token.userId;
      session.accountId = token.accountId;
      return session;
    },
  },
  pages: { signIn: "/login" },
};

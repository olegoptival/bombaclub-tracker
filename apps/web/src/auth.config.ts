import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config. NO Prisma, NO bcrypt — only
 * what middleware needs to gate routes.
 *
 * The actual `authorize` (with DB lookup) lives in src/auth.ts.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // filled in src/auth.ts
  callbacks: {
    // Pass-through callbacks for the EDGE token shape.
    // Real DB-backed jwt callback lives in src/auth.ts and overrides this in node.
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.login = (token.login as string) ?? "";
      session.user.isSuperuser = Boolean(token.isSuperuser);
      session.user.mustChangePassword = Boolean(token.mustChangePassword);
      return session;
    },
  },
};

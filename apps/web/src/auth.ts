import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Auth.js v5 (NextAuth) configuration.
 *
 * Strategy: JWT (session stored in signed cookie, not DB).
 * Provider: Credentials only — login/password issued by super-admin.
 *
 * The JWT carries: sub (user id), login, isSuperuser, mustChangePassword.
 * We re-read isSuperuser/mustChangePassword on every request via session
 * callback — this is one DB call per RSC, but ensures the bouncer can't
 * be bypassed by stale tokens (e.g. after super-admin demotion).
 */

const credentialsSchema = z.object({
  login: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        login: { label: "Login", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { login, password } = parsed.data;
        const user = await db.users.findUnique({
          where: { login },
          select: { id: true, login: true, password_hash: true },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return null;

        // Return shape: this becomes the `user` arg in the jwt callback below
        return { id: user.id, login: user.login };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On sign-in: stash user.id into token
      if (user?.id) {
        token.sub = user.id;
      }

      // Re-read live flags from DB on every token refresh.
      // This makes "demote super-admin" / "force password change" take effect
      // without waiting for token expiry.
      if (token.sub) {
        const fresh = await db.users.findUnique({
          where: { id: token.sub },
          select: {
            login: true,
            is_superuser: true,
            password_changed_at: true,
          },
        });
        if (!fresh) {
          // User deleted while session active — invalidate
          return null;
        }
        token.login = fresh.login;
        token.isSuperuser = fresh.is_superuser;
        token.mustChangePassword = fresh.password_changed_at === null;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.login = (token.login as string) ?? "";
      session.user.isSuperuser = Boolean(token.isSuperuser);
      session.user.mustChangePassword = Boolean(token.mustChangePassword);
      return session;
    },
  },
});

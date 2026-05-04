import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";

const credentialsSchema = z.object({
  login: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
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

        return { id: user.id, login: user.login };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Full JWT callback runs in node — re-reads live user data
    async jwt({ token, user, trigger }) {
      if (user?.id) token.sub = user.id;
      if (token.sub) {
        const fresh = await db.users.findUnique({
          where: { id: token.sub },
          select: {
            login: true,
            is_superuser: true,
            password_changed_at: true,
          },
        });
        if (!fresh) return null;
        token.login = fresh.login;
        token.isSuperuser = fresh.is_superuser;
        token.mustChangePassword = fresh.password_changed_at === null;
      }
      return token;
    },
  },
});

/**
 * Bootstrap the first super-admin from environment variables.
 *
 * Idempotent: if any user with is_superuser=true already exists, this script
 * does nothing. Safe to run on every deploy.
 *
 * Required env vars: SUPERADMIN_LOGIN, SUPERADMIN_PASSWORD
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const login = process.env.SUPERADMIN_LOGIN?.trim();
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!login || !password) {
    console.error(
      "❌ SUPERADMIN_LOGIN and SUPERADMIN_PASSWORD must be set in environment"
    );
    process.exit(1);
  }

  if (login.length < 3) {
    console.error("❌ SUPERADMIN_LOGIN must be at least 3 characters");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ SUPERADMIN_PASSWORD must be at least 8 characters");
    process.exit(1);
  }

  // Check whether any super-admin already exists
  const existing = await db.users.findFirst({
    where: { is_superuser: true },
    select: { id: true, login: true },
  });

  if (existing) {
    console.log(
      `ℹ️  Super-admin already exists (login: ${existing.login}). Nothing to do.`
    );
    return;
  }

  // Also check that login is not taken by a regular user
  const conflict = await db.users.findUnique({ where: { login } });
  if (conflict) {
    console.error(
      `❌ Login "${login}" is already taken by a non-superuser. Pick a different SUPERADMIN_LOGIN or promote the existing user manually.`
    );
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 12);

  // password_changed_at = NULL means: temporary password, must be changed on first login
  const user = await db.users.create({
    data: {
      login,
      password_hash,
      display_name: "Super Admin",
      is_superuser: true,
      password_changed_at: null,
    },
    select: { id: true, login: true },
  });

  console.log(`✓ Created super-admin: ${user.login} (id: ${user.id})`);
  console.log(
    `  Sign in at /login with this login and the password from SUPERADMIN_PASSWORD.`
  );
  console.log(`  You will be forced to change the password on first login.`);
}

main()
  .catch((err) => {
    console.error("❌ Bootstrap failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "");

  if (!login || !password) {
    return { error: "Login and password are required." };
  }

  try {
    await signIn("credentials", {
      login,
      password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      // Don't leak whether it was a wrong login or wrong password
      return { error: "Login failed. Check your credentials and try again." };
    }
    throw err;
  }

  // Successful — middleware will route us further (e.g. to /first-login if needed)
  redirect(from && from.startsWith("/") ? from : "/");
}

"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export type LoginState = {
  error?: string;
  redirectTo?: string;
};

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
      return { error: "Login failed. Check your credentials and try again." };
    }
    throw err;
  }

  // Don't redirect from the action — let the client navigate, that lets
  // the browser commit the session cookie before middleware sees it.
  return { redirectTo: from && from.startsWith("/") ? from : "/" };
}

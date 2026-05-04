import { LoginForm } from "./form";

export const metadata = { title: "Sign in · Bombaclub Tracker" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm from={params.from ?? ""} />;
}

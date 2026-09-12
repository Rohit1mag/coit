import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthForm
      mode="login"
      oauthFailed={params.error === "auth"}
      oauthReason={params.reason}
    />
  );
}

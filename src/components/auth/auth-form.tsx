"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.55-5.17 3.55-8.65"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.47 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.14 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.61l4 3.11C6.22 6.86 8.87 4.75 12 4.75"
      />
    </svg>
  );
}

function oauthErrorMessage(reason?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const callback = supabaseUrl
    ? `${supabaseUrl}/auth/v1/callback`
    : "https://YOUR_PROJECT.supabase.co/auth/v1/callback";
  if (reason?.includes("Unable to exchange external code")) {
    return `Google accepted the sign-in, but Supabase could not exchange the token. In Google Cloud, the authorized redirect URI must be exactly ${callback}, and that client’s secret must match Authentication → Google in Supabase.`;
  }
  return reason?.trim() || "Google sign-in did not complete. Try again.";
}

export function AuthForm({
  mode,
  oauthFailed = false,
  oauthReason,
}: {
  mode: "login" | "signup";
  oauthFailed?: boolean;
  oauthReason?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    oauthFailed ? oauthErrorMessage(oauthReason) : null,
  );

  async function passwordAuth(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        if (!orgName.trim()) {
          setError("Enter a company name to create a workspace.");
          return;
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { org_name: orgName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          router.push("/dashboard");
          router.refresh();
          return;
        }
        setMessage("Check your email to confirm the account, then sign in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function magicLink(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();
    const origin = window.location.origin;

    try {
      if (mode === "signup" && !orgName.trim()) {
        setError("Enter a company name to create a workspace.");
        return;
      }
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: mode === "signup" ? { org_name: orgName.trim() } : undefined,
        },
      });
      if (otpError) throw otpError;
      setMessage("Magic link sent. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send magic link");
    } finally {
      setBusy(false);
    }
  }

  async function googleAuth() {
    setBusy(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: "select_account" },
          data: mode === "signup" && orgName.trim() ? { org_name: orgName.trim() } : undefined,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Sign in to your workspace" : "Create a workspace"}</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Sign in with Google, a password, or a magic link."
            : "Start with Google or email. Then add your first certificate."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Could not continue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {message ? (
          <Alert className="mb-4">
            <AlertTitle>Check your email</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}

        {mode === "signup" ? (
          <div className="mb-4 grid gap-1.5">
            <Label htmlFor="org">Company name</Label>
            <Input
              id="org"
              value={orgName}
              onChange={(event) => setOrgName(event.target.value)}
              placeholder="Apex Construction"
            />
            <p className="text-xs text-muted-foreground">
              Required for email signup. Optional with Google.
            </p>
          </div>
        ) : null}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={busy}
          onClick={googleAuth}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />}
          Continue with Google
        </Button>

        <div className="relative my-4">
          <Separator />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="bg-card px-2 text-xs text-muted-foreground">or</span>
          </span>
        </div>

        <Tabs defaultValue="password">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="password" className="flex-1">
              Password
            </TabsTrigger>
            <TabsTrigger value="magic" className="flex-1">
              Magic link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <form onSubmit={passwordAuth} className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {mode === "login" ? "Sign in" : "Create account"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="magic">
            <form onSubmit={magicLink} className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="email-magic">Email</Label>
                <Input
                  id="email-magic"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Email me a link
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
                Get started
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

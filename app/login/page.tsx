import { FormEvent, Suspense, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter, useSearchParams } from "@/lib/router";
import { login } from "@/lib/api";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<"citizen" | "authority" | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function useDemoAccount(type: "citizen" | "authority") {
    setSelectedDemo(type);
    setEmail(type === "citizen" ? "citizen@civicconnect.ai" : "authority@civicconnect.ai");
    setPassword(type === "citizen" ? "citizen123" : "authority123");
    setError("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await login({ email, password, remember_me: rememberMe });
      await refreshUser();
      const defaultRoute = response.user.role === "authority" || response.user.role === "admin" ? "/authority" : "/dashboard";
      router.push(params.get("next") ?? defaultRoute);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-slate-100 p-2 text-slate-950 sm:p-4 flex items-center justify-center">
      <div className="mx-auto w-full max-w-7xl">
        <section className="flex min-w-0 flex-col rounded-[1.75rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/10">
          <header className="shrink-0 bg-slate-950 rounded-t-[1.75rem] px-5 py-5 text-white sm:px-8 sm:py-6 lg:px-10">
            <Link href="/login" className="inline-flex items-center gap-3 rounded-2xl bg-white/10 p-2 pr-4 font-bold">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                <ShieldCheck className="h-5 w-5" />
              </span>
              CivicConnect AI
            </Link>
            <div className="mt-5 max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Secure Access</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight tracking-normal sm:text-4xl lg:text-5xl">Sign in to your civic workspace.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Citizens report local issues. Authorities manage assigned requests through JWT-protected accounts.
              </p>
            </div>
            <div className="mt-4 grid max-w-3xl gap-2 text-sm text-slate-200 sm:grid-cols-3">
              {["Role-based dashboard", "Session storage per tab", "PostgreSQL user records"].map((item) => (
                <span key={item} className="flex min-w-0 items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-300" />
                  <span className="truncate">{item}</span>
                </span>
              ))}
            </div>
          </header>

          <div className="flex-1 px-5 py-5 sm:px-8 lg:px-10">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Login</p>
              <h2 className="mt-1 text-3xl font-bold tracking-normal">Welcome back</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Use your registered email and password.</p>
            </div>

            <form className="grid min-h-0 gap-4" onSubmit={onSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { key: "citizen" as const, title: "Normal User", email: "citizen@civicconnect.ai", icon: UserRound },
                  { key: "authority" as const, title: "Authority", email: "authority@civicconnect.ai", icon: Building2 }
                ].map((account) => {
                  const Icon = account.icon;
                  const active = selectedDemo === account.key || email.toLowerCase() === account.email;
                  return (
                    <button
                      key={account.key}
                      type="button"
                      onClick={() => useDemoAccount(account.key)}
                      className={cn(
                        "min-w-0 rounded-2xl border p-4 text-left transition hover:border-blue-300",
                        active ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50"
                      )}
                    >
                      <span className="mb-2 flex items-center justify-between gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                          <Icon className="h-5 w-5" />
                        </span>
                        {active ? <CheckCircle2 className="h-5 w-5 text-blue-600" /> : null}
                      </span>
                      <span className="block font-bold">{account.title}</span>
                      <span className="mt-1 block truncate text-xs font-semibold text-blue-700">{account.email}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@civicconnect.ai"
                      className="soft-field h-12 rounded-2xl pl-12"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setSelectedDemo(null);
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="password">Password</Label>
                    <Link className="shrink-0 text-sm font-semibold text-blue-600 hover:underline" href="/forgot-password">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="soft-field h-12 rounded-2xl pl-12 pr-12"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid items-center gap-3 sm:grid-cols-[1fr_220px]">
                <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={(value) => setRememberMe(Boolean(value))} />
                  <Label htmlFor="remember" className="truncate text-sm font-semibold text-slate-600">
                    Remember this session
                  </Label>
                </div>

                <Button className="blue-action h-12 w-full rounded-2xl" type="submit" disabled={submitting}>
                  {submitting ? "Signing in..." : "Sign in"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
            </form>

            <p className="mt-4 text-center text-sm text-slate-500">
              New to CivicConnect AI?{" "}
              <Link className="font-semibold text-slate-950 hover:underline" href="/register">
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-20 text-center text-sm text-muted-foreground">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

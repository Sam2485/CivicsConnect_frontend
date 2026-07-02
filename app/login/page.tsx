import { FormEvent, Suspense, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter, useSearchParams } from "@/lib/router";
import { login } from "@/lib/api";

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
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.46),transparent_26%),radial-gradient(circle_at_78%_16%,rgba(168,85,247,0.34),transparent_24%),radial-gradient(circle_at_48%_92%,rgba(251,191,36,0.36),transparent_28%),linear-gradient(135deg,#e0f2fe,#f8fafc_46%,#ecfccb)] p-4 text-black">
      <div className="grid h-full w-full place-items-center overflow-hidden">
        <section className="relative flex h-[min(82vh,540px)] w-[min(88vw,760px)] items-center justify-center gap-5 overflow-hidden rounded-[18px] border border-white/45 bg-white/20 p-5 text-black shadow-2xl shadow-sky-950/20 backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.58),transparent_34%,rgba(216,180,254,0.22))] after:pointer-events-none after:absolute after:inset-[1px] after:rounded-[17px] after:border after:border-white/25 sm:h-[min(62vh,540px)] sm:p-7 lg:p-10">
          <div className="relative z-10 hidden w-[45%] shrink-0 items-center justify-center p-4 sm:block lg:p-10">
            <Link href="/login" className="mb-5 inline-flex items-center gap-3 rounded-2xl border border-sky-100/80 bg-white/55 p-2 pr-4 text-sm font-bold shadow-lg shadow-sky-950/10">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white">
                <ShieldCheck className="h-5 w-5" />
              </span>
              CivicConnect AI
            </Link>
            <h1 className="mb-3 text-4xl font-bold leading-tight text-black drop-shadow-sm">Welcome Back!</h1>
            <p className="text-sm font-semibold leading-6 text-black/80 lg:text-base">
              Please login to your account. CivicConnect helps citizens report local issues and helps authorities respond with clear, verified progress.
            </p>
            <div className="mt-5 grid gap-2 text-sm font-semibold text-black/80">
              <span className="rounded-full border border-blue-200 bg-blue-50/70 px-4 py-2 text-blue-950 shadow-sm">JWT protected access</span>
              <span className="rounded-full border border-amber-200 bg-amber-50/70 px-4 py-2 text-amber-950 shadow-sm">Citizen and authority workspace</span>
            </div>
          </div>

          <div className="relative z-10 w-full max-w-[310px] overflow-hidden rounded-[24px] border border-violet-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.84),rgba(219,234,254,0.56)_40%,rgba(245,208,254,0.44))] p-4 shadow-2xl shadow-violet-950/20 backdrop-blur-xl before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_18%_8%,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(236,72,153,0.14),transparent_24%),linear-gradient(140deg,rgba(255,255,255,0.62),transparent_42%,rgba(34,197,94,0.12))] sm:p-5 lg:p-6">
            <form onSubmit={onSubmit}>
              <div className="relative z-10 mb-4 flex justify-center sm:hidden">
                <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl border border-sky-100/80 bg-white/60 p-2 pr-4 text-sm font-bold shadow-md shadow-sky-950/10">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  CivicConnect AI
                </Link>
              </div>
              <h2 className="relative z-10 mb-1 text-center font-['Trebuchet_MS'] text-2xl font-bold tracking-normal">Login Page</h2>
              <p className="relative z-10 mb-3 text-center text-xs font-semibold text-black/65">Choose account type and continue</p>

              <div className="relative z-10 mb-3 flex items-center justify-center gap-4 rounded-[16px] border border-sky-200/80 bg-white/60 p-2.5 shadow-inner shadow-white/40">
                {[
                  { key: "citizen" as const, label: "Citizen", icon: UserRound, color: "from-blue-500 to-cyan-400" },
                  { key: "authority" as const, label: "Authority", icon: Building2, color: "from-violet-500 to-fuchsia-400" },
                  { key: null, label: "Secure", icon: ShieldCheck, color: "from-emerald-500 to-lime-400" }
                ].map((item) => {
                  const Icon = item.icon;
                  const active = item.key !== null && (selectedDemo === item.key || email.toLowerCase() === `${item.key}@civicconnect.ai`);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        if (item.key) {
                          useDemoAccount(item.key);
                        }
                      }}
                      className={`relative flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-gradient-to-br ${item.color} text-white shadow-lg shadow-slate-950/15 transition duration-300 hover:scale-110`}
                      aria-label={item.label}
                    >
                      <Icon className="h-5 w-5" />
                      {active ? <CheckCircle2 className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-white text-lime-600" /> : null}
                    </button>
                  );
                })}
              </div>

              <div className="relative z-10">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Username or email"
                  className="mt-3 h-12 w-full rounded-[14px] border border-sky-200/80 bg-white/88 px-5 pl-11 text-base shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition duration-300 hover:scale-[1.02] focus-visible:border-sky-400 focus-visible:bg-white focus-visible:ring-sky-200"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setSelectedDemo(null);
                  }}
                  required
                />
              </div>

              <div className="relative z-10">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  className="mt-3 h-12 w-full rounded-[14px] border border-violet-200/80 bg-white/88 px-5 pl-11 pr-11 text-base shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition duration-300 hover:scale-[1.02] focus-visible:border-violet-400 focus-visible:bg-white focus-visible:ring-violet-200"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 hover:bg-white/70 hover:text-black"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="relative z-10 mt-4 flex items-center gap-2 font-['Lucida_Sans'] text-sm">
                <Checkbox id="remember" checked={rememberMe} onCheckedChange={(value) => setRememberMe(Boolean(value))} />
                <Label htmlFor="remember" className="font-normal text-black">Remember Me</Label>
              </div>

              {error ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50/90 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}

              <button
                className="relative z-10 mx-auto mt-4 flex h-11 w-[142px] items-center justify-center gap-2 rounded-full border-0 bg-[#7fff00] bg-gradient-to-br from-[#b7ec4d] via-[#9acd32] to-[#4ade80] text-sm font-bold tracking-[0.5px] text-[#102000] shadow-[0_10px_24px_rgba(50,120,10,0.32)] transition duration-300 hover:-translate-y-1 hover:from-[#c9ff5f] hover:via-[#a8df35] hover:to-[#22c55e] hover:shadow-[0_14px_30px_rgba(50,120,10,0.38)] disabled:cursor-wait disabled:bg-[#7fff00] disabled:from-[#b7ec4d] disabled:via-[#9acd32] disabled:to-[#4ade80] disabled:text-[#102000] disabled:opacity-80 disabled:hover:translate-y-0"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Login..." : "Login"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="relative z-10 mt-4 flex items-center justify-between gap-3 font-['Lucida_Sans'] text-sm">
                <Link href="/forgot-password" className="text-black no-underline transition duration-300 hover:text-[#7fff00] hover:underline">
                  Forgot Password?
                </Link>
                <Link href="/register" className="text-black no-underline transition duration-300 hover:text-[#7fff00] hover:underline">
                  Sign Up
                </Link>
              </div>
            </form>
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

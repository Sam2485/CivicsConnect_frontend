import { CheckCircle2, Database, LockKeyhole, MapPin, ShieldCheck, Sparkles } from "lucide-react";

import { Link } from "@/lib/router";

export function AuthShell({
  title,
  subtitle,
  children,
  footer
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f7fb] px-3 py-3 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-7xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-2xl shadow-slate-950/10 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
          <section className="relative hidden min-h-[720px] overflow-hidden bg-[#101827] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[linear-gradient(145deg,#0f172a_0%,#132456_42%,#0f766e_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:48px_48px] opacity-50" />
            <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="absolute -bottom-20 left-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="relative z-10">
              <Link href="/login" className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-2 pr-5 text-sm font-bold backdrop-blur-xl">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-950/30">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                CivicConnect AI
              </Link>
            </div>

            <div className="relative z-10 max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100 backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Secure civic identity
              </div>
              <h1 className="text-5xl font-bold leading-tight tracking-normal xl:text-6xl">One secure login for citizens and authorities.</h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
                CivicConnect uses PostgreSQL users, bcrypt password hashing, and JWT access tokens for role-based citizen and authority workspaces.
              </p>
              <div className="mt-8 grid max-w-xl gap-3">
                {["Citizen reports route by department and GPS.", "Authorities receive only assigned local requests.", "JWT bearer tokens protect dashboard APIs."].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100 backdrop-blur">
                    <CheckCircle2 className="h-5 w-5 text-cyan-200" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-3">
              {[
                { label: "PostgreSQL", value: "Users", icon: Database },
                { label: "BCrypt", value: "Hashing", icon: LockKeyhole },
                { label: "JWT", value: "Bearer + Cookie", icon: MapPin }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <Icon className="mb-3 h-5 w-5 text-blue-200" />
                    <p className="text-lg font-bold">{item.label}</p>
                    <p className="text-sm text-slate-300">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="flex min-h-[680px] items-center justify-center p-5 sm:p-8 lg:p-12">
            <div className="w-full max-w-xl">
              <div className="mb-7 lg:hidden">
                <Link href="/login" className="inline-flex items-center gap-3 text-sm font-bold">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  CivicConnect AI
                </Link>
              </div>

              <div className="mb-7">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-blue-600">CivicConnect Secure Access</p>
                <h2 className="text-4xl font-bold tracking-normal text-slate-950">{title}</h2>
                <p className="mt-3 text-base leading-7 text-slate-500">{subtitle}</p>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/8 sm:p-7">
                {children}
              </div>

              <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

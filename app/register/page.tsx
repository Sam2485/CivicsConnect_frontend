import { FormEvent, useState } from "react";
import { ArrowRight, Building2, Eye, EyeOff, Loader2, LockKeyhole, Mail, MapPin, Phone, ShieldCheck, User } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useRouter } from "@/lib/router";
import { register } from "@/lib/api";
import type { Role } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
    role: "citizen" as Role,
    department: "Road Department",
    zone: "Central Civic Zone",
    latitude: "28.6139",
    longitude: "77.2090",
    radius_km: "20"
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        radius_km: Number(form.radius_km)
      });
      await refreshUser();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    "h-11 rounded-[14px] border border-sky-200/80 bg-white/88 pl-11 shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition duration-300 hover:scale-[1.01] focus-visible:border-sky-400 focus-visible:bg-white focus-visible:ring-sky-200";
  const selectClass =
    "h-11 rounded-[14px] border border-violet-200/80 bg-white/88 shadow-[0_10px_26px_rgba(15,23,42,0.08)] focus:ring-violet-200";

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.46),transparent_26%),radial-gradient(circle_at_78%_16%,rgba(168,85,247,0.34),transparent_24%),radial-gradient(circle_at_48%_92%,rgba(251,191,36,0.36),transparent_28%),linear-gradient(135deg,#e0f2fe,#f8fafc_46%,#ecfccb)] p-4 text-black">
      <div className="grid h-full w-full place-items-center overflow-hidden">
        <section className="relative flex h-[min(84vh,620px)] w-[min(86vw,840px)] items-center justify-center gap-6 overflow-hidden rounded-[18px] border border-white/45 bg-white/20 p-5 text-black shadow-2xl shadow-sky-950/20 backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.58),transparent_34%,rgba(216,180,254,0.22))] after:pointer-events-none after:absolute after:inset-[1px] after:rounded-[17px] after:border after:border-white/25 sm:h-[min(72vh,620px)] sm:p-7 lg:p-8">
          <div className="relative z-10 hidden w-[40%] shrink-0 p-4 sm:block lg:p-6">
            <Link href="/login" className="mb-5 inline-flex items-center gap-3 rounded-2xl border border-sky-100/80 bg-white/55 p-2 pr-4 text-sm font-bold shadow-lg shadow-sky-950/10">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white">
                <ShieldCheck className="h-5 w-5" />
              </span>
              CivicConnect AI
            </Link>
            <h1 className="mb-3 text-4xl font-bold leading-tight text-black drop-shadow-sm">Create Account</h1>
            <p className="text-sm font-semibold leading-6 text-black/80">
              Join CivicConnect as a citizen or authority. Your account connects reports, assignments, and resolution records through the same secure workflow.
            </p>
            <div className="mt-5 grid gap-2 text-sm font-semibold">
              <span className="rounded-full border border-blue-200 bg-blue-50/70 px-4 py-2 text-blue-950 shadow-sm">Role-based access</span>
              <span className="rounded-full border border-violet-200 bg-violet-50/70 px-4 py-2 text-violet-950 shadow-sm">Authority service zones</span>
              <span className="rounded-full border border-amber-200 bg-amber-50/70 px-4 py-2 text-amber-950 shadow-sm">Database-backed records</span>
            </div>
          </div>

          <div className="relative z-10 flex h-full w-full max-w-[410px] flex-col overflow-hidden rounded-[24px] border border-violet-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.84),rgba(219,234,254,0.56)_40%,rgba(245,208,254,0.44))] p-4 shadow-2xl shadow-violet-950/20 backdrop-blur-xl before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_18%_8%,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(236,72,153,0.14),transparent_24%),linear-gradient(140deg,rgba(255,255,255,0.62),transparent_42%,rgba(34,197,94,0.12))] sm:p-5 lg:p-6">
            <div className="relative z-10 mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700">Sign Up</p>
                <h2 className="font-['Trebuchet_MS'] text-2xl font-bold tracking-normal">Create your account</h2>
              </div>
              <Link href="/login" className="shrink-0 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-bold text-slate-950 shadow-sm hover:text-blue-700">
                Sign in
              </Link>
            </div>

            <form className="relative z-10 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1" onSubmit={onSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                    <Input id="name" className={fieldClass} placeholder="Ayush Sharma" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                    <Input id="phone" className={fieldClass} type="tel" placeholder="+91 99999 99999" value={form.phone_number} onChange={(event) => updateField("phone_number", event.target.value)} required />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-500" />
                  <Input id="email" className={fieldClass} type="email" autoComplete="email" placeholder="you@civicconnect.ai" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Select value={form.role} onValueChange={(value) => updateField("role", value)}>
                  <SelectTrigger id="role" className={selectClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="citizen">Citizen</SelectItem>
                    <SelectItem value="authority">Authority</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.role === "authority" || form.role === "admin" ? (
                <div className="rounded-[18px] border border-amber-200/80 bg-amber-50/70 p-3 shadow-inner shadow-white/30">
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-950">
                    <Building2 className="h-4 w-4" />
                    Authority Service Area
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="department">Department</Label>
                      <Select value={form.department} onValueChange={(value) => updateField("department", value)}>
                        <SelectTrigger id="department" className={selectClass}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Road Department", "Sanitation Department", "Water Department", "Electrical Department", "Drainage Department"].map((item) => (
                            <SelectItem key={item} value={item}>{item}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="zone">Zone</Label>
                      <Input id="zone" className={fieldClass} value={form.zone} onChange={(event) => updateField("zone", event.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="latitude">Latitude</Label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600" />
                        <Input id="latitude" className={fieldClass} inputMode="decimal" value={form.latitude} onChange={(event) => updateField("latitude", event.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="longitude">Longitude</Label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600" />
                        <Input id="longitude" className={fieldClass} inputMode="decimal" value={form.longitude} onChange={(event) => updateField("longitude", event.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="radius">Service Radius KM</Label>
                      <Input id="radius" className="h-11 rounded-[14px] border border-amber-200/80 bg-white/88 shadow-[0_10px_26px_rgba(15,23,42,0.08)] focus-visible:border-amber-400 focus-visible:ring-amber-200" inputMode="numeric" value={form.radius_km} onChange={(event) => updateField("radius_km", event.target.value)} />
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      minLength={8}
                      className={`${fieldClass} pr-11`}
                      placeholder="Minimum 8 characters"
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
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
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                    <Input
                      id="confirm_password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      minLength={8}
                      className={fieldClass}
                      placeholder="Repeat password"
                      value={form.confirm_password}
                      onChange={(event) => updateField("confirm_password", event.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {error ? <p className="rounded-xl border border-red-200 bg-red-50/90 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}

              <button
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full border-0 bg-[#7fff00] bg-gradient-to-br from-[#b7ec4d] via-[#9acd32] to-[#4ade80] text-sm font-bold tracking-[0.5px] text-[#102000] shadow-[0_10px_24px_rgba(50,120,10,0.32)] transition duration-300 hover:-translate-y-1 hover:from-[#c9ff5f] hover:via-[#a8df35] hover:to-[#22c55e] hover:shadow-[0_14px_30px_rgba(50,120,10,0.38)] disabled:cursor-wait disabled:opacity-80 disabled:hover:translate-y-0"
                type="submit"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Create CivicConnect account
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

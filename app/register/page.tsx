import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, Phone, User } from "lucide-react";

import { AuthShell } from "@/components/auth-shell";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
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

  return (
    <AuthShell
      title="Create your account"
      subtitle="Create a PostgreSQL-backed CivicConnect account with email and password."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-medium text-foreground hover:underline" href="/login">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input id="name" className="soft-field h-12 pl-10" placeholder="Ayush Sharma" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input id="phone" className="soft-field h-12 pl-10" type="tel" placeholder="+91 99999 99999" value={form.phone_number} onChange={(event) => updateField("phone_number", event.target.value)} required />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input id="email" className="soft-field h-12 pl-10" type="email" autoComplete="email" placeholder="you@civicconnect.ai" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={form.role} onValueChange={(value) => updateField("role", value)}>
            <SelectTrigger id="role" className="soft-field h-12">
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
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-3 text-sm font-bold text-slate-950">Authority Service Area</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={form.department} onValueChange={(value) => updateField("department", value)}>
                  <SelectTrigger id="department" className="soft-field h-12 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Road Department", "Sanitation Department", "Water Department", "Electrical Department", "Drainage Department"].map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone">Zone</Label>
                <Input id="zone" className="soft-field h-12 bg-white" value={form.zone} onChange={(event) => updateField("zone", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" className="soft-field h-12 bg-white" inputMode="decimal" value={form.latitude} onChange={(event) => updateField("latitude", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" className="soft-field h-12 bg-white" inputMode="decimal" value={form.longitude} onChange={(event) => updateField("longitude", event.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="radius">Service Radius KM</Label>
                <Input id="radius" className="soft-field h-12 bg-white" inputMode="numeric" value={form.radius_km} onChange={(event) => updateField("radius_km", event.target.value)} />
              </div>
            </div>
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                className="soft-field h-12 pl-10 pr-11"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="confirm_password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                className="soft-field h-12 pl-10"
                placeholder="Repeat password"
                value={form.confirm_password}
                onChange={(event) => updateField("confirm_password", event.target.value)}
                required
              />
            </div>
          </div>
        </div>
        {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
        <Button className="blue-action h-12 w-full rounded-2xl" type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Create CivicConnect account
        </Button>
      </form>
    </AuthShell>
  );
}

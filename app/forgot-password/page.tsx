import { FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Search, UserRound } from "lucide-react";

import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/lib/router";
import { checkForgotPasswordUser, forgotPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [accountName, setAccountName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function checkAccount() {
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const response = await checkForgotPasswordUser({ username });
      setAccountName(response.name);
      setAccountVerified(true);
      setMessage(response.message);
    } catch (err) {
      setAccountVerified(false);
      setError(err instanceof Error ? err.message : "Unable to find account");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accountVerified) {
      await checkAccount();
      return;
    }
    setError("");
    setMessage("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await forgotPassword({ username, password, confirm_password: confirmPassword });
      setMessage(response.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your registered username, email, or phone number. If it exists, set a new password."
      footer={
        <Link className="inline-flex items-center gap-2 font-medium text-foreground hover:underline" href="/login">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="username"
              autoComplete="username"
              placeholder="Name, email, or phone"
              className="soft-field h-12 pl-10"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setAccountVerified(false);
                setAccountName("");
                setMessage("");
              }}
              required
            />
          </div>
        </div>

        {accountVerified ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Account found: {accountName}
            </span>
          </div>
        ) : null}

        {accountVerified ? (
          <div className="grid gap-4">
            {[
              { id: "password", label: "New password", value: password, setter: setPassword },
              { id: "confirm-password", label: "Re-type new password", value: confirmPassword, setter: setConfirmPassword }
            ].map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id={field.id}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="soft-field h-12 pl-10 pr-10"
                    value={field.value}
                    onChange={(event) => field.setter(event.target.value)}
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{message}</p> : null}
        {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}

        <Button className="blue-action h-12 w-full rounded-2xl" type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : accountVerified ? <KeyRound className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          {accountVerified ? "Update password" : "Find account"}
        </Button>
      </form>
    </AuthShell>
  );
}

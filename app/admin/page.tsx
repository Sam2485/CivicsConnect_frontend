import { UserCog } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";

export default function AdminPage() {
  return (
    <RequireRole roles={["admin"]}>
      <AppShell>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <UserCog className="mb-4 h-6 w-6 text-teal-700" />
          <h1 className="text-2xl font-semibold">Admin Console</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Manage account roles, system-level access policies, and platform-wide CivicConnect AI controls.
          </p>
        </div>
      </AppShell>
    </RequireRole>
  );
}

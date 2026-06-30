import { useEffect } from "react";

import { useAuth } from "@/components/auth-provider";
import { usePathname, useRouter } from "@/lib/router";
import type { Role } from "@/lib/types";

export function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!loading && user && !roles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [loading, pathname, roles, router, user]);

  if (loading || !user || !roles.includes(user.role)) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Checking access...</div>;
  }

  return children;
}

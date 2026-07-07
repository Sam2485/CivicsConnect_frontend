import {
  BarChart3,
  ClipboardList,
  ClipboardPlus,
  FileBarChart,
  History,
  LayoutDashboard,
  LogOut,
  Map,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserCog,
  Wrench
} from "lucide-react";
import type { ReactNode } from "react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Link, usePathname, useSearchParams } from "@/lib/router";
import { cn } from "@/lib/utils";

const citizenNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/issues", label: "Report Issue", icon: ClipboardPlus },
  { href: "/history", label: "Your Reported History", icon: History },
  { href: "/map", label: "Issue Map", icon: Map }
];

const authorityNav = [
  { href: "/authority", label: "Dashboard", icon: LayoutDashboard },
  { href: "/authority?section=complaints", label: "Complaints", icon: ClipboardList },
  { href: "/authority?section=assignments", label: "Assignments", icon: Wrench },
  { href: "/authority?section=workers", label: "Add Worker", icon: UserPlus },
  { href: "/authority?section=completion", label: "Completion Update", icon: BarChart3 },
  { href: "/authority?section=reports", label: "Reports", icon: FileBarChart }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const visibleNav = user?.role === "authority" || user?.role === "admin" ? authorityNav : citizenNav;
  const lockedWorkspace = pathname === "/issues" || pathname === "/history" || pathname === "/map" || pathname === "/authority";
  const currentSection = searchParams.get("section") ?? "dashboard";
  const compactNav = visibleNav.length > 6;
  const isActive = (href: string) => {
    const [itemPath, itemQuery] = href.split("?");
    const itemSection = new URLSearchParams(itemQuery ?? "").get("section") ?? "dashboard";
    return pathname === itemPath && (itemPath !== "/authority" || currentSection === itemSection);
  };
  const shortLabel = (label: string) =>
    label
      .replace("Your Reported History", "History")
      .replace("Report Issue", "Report")
      .replace("Completion Update", "Complete");

  return (
    <main className={cn("min-h-screen overflow-x-hidden bg-[#f3f6fb] text-foreground", lockedWorkspace && "lg:h-screen lg:overflow-hidden")}>
      <aside className="fixed inset-y-4 left-4 z-40 hidden w-[272px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0d1728] text-white shadow-2xl shadow-slate-950/25 lg:flex">
        <div className={cn("px-5 pt-5", compactNav ? "pb-2" : "pb-4")}>
          <Link href="/dashboard" className="flex items-center gap-3 rounded-2xl p-1 transition hover:bg-white/5">
            <span className={cn("flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-950/30", compactNav ? "h-11 w-11" : "h-12 w-12")}>
            <ShieldCheck className={cn(compactNav ? "h-5 w-5" : "h-6 w-6")} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold leading-5">CivicConnect AI</p>
              <p className="text-xs text-slate-400">{user?.role === "authority" ? "Authority workspace" : "Citizen workspace"}</p>
            </div>
          </Link>
        </div>

        <div className={cn("flex min-h-0 flex-1 flex-col px-4", compactNav ? "pb-2" : "pb-4")}>
          <div className={cn("rounded-2xl border border-white/10 bg-white/10", compactNav ? "mb-2 p-2.5" : "mb-5 p-3")}>
            <p className={cn("text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500", compactNav ? "mb-1" : "mb-2")}>Workspace</p>
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              {user?.role === "authority" || user?.role === "admin" ? "Municipal Command" : "Civic Response"}
            </div>
            <p className={cn("mt-1 text-xs text-slate-400", compactNav ? "leading-4" : "leading-5")}>{user?.role === "authority" || user?.role === "admin" ? "Assignment and resolution ops" : "AI reporting review"}</p>
          </div>

          <p className={cn("px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500", compactNav ? "mb-2" : "mb-3")}>Navigation</p>
          <nav className={cn("hide-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pb-2", compactNav ? "gap-1" : "gap-1.5")}>
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white",
                    compactNav ? "min-h-9 py-1" : "min-h-12 py-2.5",
                    active && "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-950/30 hover:from-blue-600 hover:to-blue-500"
                  )}
                >
                  <span className={cn("flex shrink-0 items-center justify-center rounded-xl bg-white/10", compactNav ? "h-7 w-7" : "h-9 w-9", active && "bg-white/20")}>
                    <Icon className={cn(compactNav ? "h-4 w-4" : "h-5 w-5")} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate">{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={cn("border-t border-white/10 bg-[#091321]", compactNav ? "p-2" : "p-3")}>
          <div className={cn("rounded-2xl border border-white/10 bg-white/10", compactNav ? "p-2" : "p-3")}>
            <div className={cn("flex items-center gap-3", compactNav ? "mb-2" : "mb-3")}>
              <span className={cn("flex shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-950", compactNav ? "h-9 w-9" : "h-10 w-10")}>
                {(user?.name ?? "A").slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user?.name ?? "Account"}</p>
                <p className="text-xs capitalize text-slate-400">{user?.role ?? "loading"}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className={cn("w-full border-white/10 bg-white text-slate-950 shadow-none hover:bg-blue-50", compactNav ? "h-9" : "h-10")}
              onClick={() => void logout()}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/90 shadow-sm backdrop-blur-2xl lg:hidden">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-2">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3 font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate leading-5">CivicConnect AI</span>
              <span className="block truncate text-xs font-normal capitalize text-slate-500">{user?.role ?? "workspace"}</span>
            </span>
          </Link>
          <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 bg-white/80" onClick={() => void logout()} aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className={cn("relative z-10 min-w-0 px-3 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 lg:ml-[292px] lg:px-8 lg:pb-4", lockedWorkspace ? "lg:h-full lg:overflow-hidden" : "sm:py-6")}>
        <div className={cn("mx-auto w-full max-w-7xl min-w-0", lockedWorkspace && "lg:h-full lg:overflow-hidden")}>{children}</div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-flow-col auto-cols-fr gap-1 rounded-[1.35rem] border border-white/70 bg-white/95 p-1.5 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl lg:hidden" style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-bold leading-tight text-slate-500 transition",
                active && "bg-slate-950 text-white shadow-lg shadow-slate-950/20"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="w-full truncate text-center">{shortLabel(item.label)}</span>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, CheckCircle2, Clock3, FileText, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDashboard } from "@/lib/api";
import type { DashboardData } from "@/lib/types";
import { cn } from "@/lib/utils";

type MetricTone = "blue" | "green" | "amber" | "cyan";

const toneClasses: Record<MetricTone, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  cyan: "bg-cyan-50 text-cyan-700 border-cyan-100"
};

function statusTone(status: string) {
  if (status.toLowerCase().includes("resolved")) return "success";
  if (status.toLowerCase().includes("review")) return "warning";
  return "secondary";
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof FileText;
  tone: MetricTone;
}) {
  return (
    <div className={cn("min-w-0 rounded-2xl border p-4", toneClasses[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-[0.12em] opacity-80">{label}</p>
          <p className="mt-2 text-3xl font-bold leading-none text-slate-950">{value}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 truncate text-sm font-semibold text-slate-600">{detail}</p>
    </div>
  );
}

function HealthBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold text-slate-950">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MiniBars({ data }: { data: DashboardData["line_chart"] }) {
  const max = Math.max(1, ...data.map((item) => item.issues));
  return (
    <div className="grid h-28 grid-cols-7 items-end gap-2">
      {data.map((item) => (
        <div key={item.label} className="flex h-full min-w-0 flex-col justify-end gap-2">
          <div className="flex min-h-0 flex-1 items-end rounded-full bg-slate-100">
            <div className="w-full rounded-full bg-blue-600" style={{ height: `${Math.max(8, (item.issues / max) * 100)}%` }} />
          </div>
          <p className="truncate text-center text-[11px] font-semibold text-slate-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    const load = () => {
      getDashboard()
        .then((data) => {
          if (!active) return;
          setDashboard(data);
          setError("");
        })
        .catch((err) => {
          if (active) setError(err instanceof Error ? err.message : "Unable to load dashboard");
        });
    };

    load();
    const timer = window.setInterval(load, 10000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const filteredRecent = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!dashboard || !term) return dashboard?.recent_issues ?? [];
    return dashboard.recent_issues.filter((issue) => Object.values(issue).join(" ").toLowerCase().includes(term));
  }, [dashboard, query]);

  const closureRate = dashboard?.total_issues ? Math.round((dashboard.resolved_issues / dashboard.total_issues) * 100) : 0;

  return (
    <RequireRole roles={["citizen", "authority", "admin"]}>
      <AppShell>
        <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-4 overflow-x-hidden lg:h-[calc(100vh-3rem)] lg:min-h-0 lg:overflow-hidden">
          <Card className="workspace-card shrink-0 rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Citizen Dashboard</p>
                  <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-950">Welcome, {user?.name ?? "Citizen"}</h1>
                  <p className="text-sm leading-6 text-slate-600">Live status from your reports and community verification.</p>
                </div>
                <div className="relative w-full lg:w-[360px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recent reports..." className="soft-field h-11 pl-10" />
                </div>
              </div>
            </CardContent>
          </Card>

          {!dashboard ? (
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border bg-white text-sm text-slate-500">
              {error || "Loading dashboard..."}
            </div>
          ) : (
            <>
              <section className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Reports" value={dashboard.total_issues} detail={`${dashboard.pending_issues} active`} icon={FileText} tone="blue" />
                <MetricCard label="Resolved" value={dashboard.resolved_issues} detail={`${closureRate}% closure`} icon={CheckCircle2} tone="green" />
                <MetricCard label="Pending" value={dashboard.pending_issues} detail="Awaiting action" icon={Clock3} tone="amber" />
                <MetricCard label="Reported" value={dashboard.nearby_issues} detail="New / pending reports" icon={MapPin} tone="cyan" />
              </section>

              <section className="grid flex-1 gap-4 overflow-visible lg:min-h-0 lg:overflow-hidden xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                <Card className="workspace-card flex min-w-0 flex-col overflow-hidden rounded-2xl border-slate-200 shadow-sm lg:min-h-0">
                  <CardHeader className="shrink-0 border-b p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle>Recent Reports</CardTitle>
                        <CardDescription>{filteredRecent.length} visible reports from your account</CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0 rounded-full">{dashboard.total_issues} total</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="hide-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
                    <div className="space-y-2">
                      {filteredRecent.map((issue) => (
                        <div key={issue.id} className="grid min-w-0 gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-[76px_minmax(0,1fr)_auto] sm:items-center">
                          <span className="font-bold text-blue-600">{issue.id}</span>
                          <span className="min-w-0">
                            <span className="block truncate font-bold text-slate-950">{issue.title}</span>
                            <span className="block truncate text-sm text-slate-500">{issue.category} - {issue.location}</span>
                          </span>
                          <span className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                            <Badge variant={statusTone(issue.status) as "default"}>{issue.status}</Badge>
                            <span className="text-xs font-semibold text-slate-400">{issue.reported_at}</span>
                          </span>
                        </div>
                      ))}
                      {filteredRecent.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No reports match your search.</div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid min-w-0 gap-4 overflow-visible lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden">
                  <Card className="workspace-card shrink-0 rounded-2xl border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-950">Community Score</p>
                          <p className="text-sm text-slate-500">Based on resolved and verified reports</p>
                        </div>
                        <span className="text-4xl font-bold text-slate-950">{dashboard.community_score}%</span>
                      </div>
                      <div className="space-y-4">
                        <HealthBar label="Infrastructure" value={dashboard.community_health.infrastructure} />
                        <HealthBar label="Cleanliness" value={dashboard.community_health.cleanliness} />
                        <HealthBar label="Response" value={dashboard.community_health.response} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="workspace-card flex flex-col overflow-hidden rounded-2xl border-slate-200 shadow-sm lg:min-h-0">
                    <CardHeader className="shrink-0 border-b p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                          <Sparkles className="h-5 w-5" />
                        </span>
                        <div>
                          <CardTitle>Live Signals</CardTitle>
                          <CardDescription>Data-derived trends</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="hide-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                      <div>
                        <div className="mb-3 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                          <p className="font-bold text-slate-950">7-day volume</p>
                        </div>
                        <MiniBars data={dashboard.line_chart} />
                      </div>

                      <div className="space-y-2">
                        {dashboard.ai_insights.map((insight) => (
                          <div key={insight.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-bold text-slate-950">{insight.title}</p>
                              <Badge variant="secondary" className="shrink-0">{insight.confidence}%</Badge>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{insight.summary}</p>
                          </div>
                        ))}
                        {dashboard.ai_insights.length === 0 ? (
                          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                            <AlertCircle className="h-4 w-4" />
                            Submit reports to generate insights.
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </>
          )}
        </div>
      </AppShell>
    </RequireRole>
  );
}

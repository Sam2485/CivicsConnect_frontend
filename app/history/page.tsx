import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, CheckCircle2, Clock3, FileImage, Search, ShieldCheck, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteIssue, getIssue, getIssues } from "@/lib/api";
import type { Issue, IssueCategory, IssueDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

const categoryLabels: Record<IssueCategory, string> = {
  pothole: "Pothole",
  garbage: "Garbage",
  water_leakage: "Water Leakage",
  streetlight: "Streetlight",
  drainage: "Drainage"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export default function HistoryPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<IssueDetail | null>(null);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const issuesLoadingRef = useRef(false);
  const detailLoadingRef = useRef(false);

  useEffect(() => {
    let active = true;
    const loadIssues = () => {
      if (issuesLoadingRef.current || document.visibilityState === "hidden") return;
      issuesLoadingRef.current = true;
      getIssues()
        .then((items) => {
          if (!active) return;
          setIssues(items);
          setSelectedId((current) => {
            if (current && items.some((issue) => issue.id === current)) {
              return current;
            }
            return items[0]?.id ?? null;
          });
        })
        .catch(() => {
          if (active) setIssues([]);
        })
        .finally(() => {
          issuesLoadingRef.current = false;
        });
    };

    loadIssues();
    const timer = window.setInterval(loadIssues, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let active = true;
    const loadDetail = () => {
      if (detailLoadingRef.current || document.visibilityState === "hidden") return;
      detailLoadingRef.current = true;
      getIssue(selectedId)
        .then((item) => {
          if (active) setDetail(item);
        })
        .catch(() => {
          if (active) setDetail(null);
        })
        .finally(() => {
          detailLoadingRef.current = false;
        });
    };

    loadDetail();
    const timer = window.setInterval(loadDetail, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selectedId]);

  const filteredIssues = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return issues;
    return issues.filter((issue) =>
      [
        issue.id,
        issue.title,
        issue.description,
        issue.status,
        issue.severity,
        categoryLabels[issue.category],
        issue.ai_department ?? ""
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [issues, query]);

  async function onDeleteIssue(issue: Issue) {
    const confirmed = window.confirm(`Delete "${issue.title}"? This removes the report from your history.`);
    if (!confirmed) return;

    setDeletingId(issue.id);
    setMessage("");
    try {
      await deleteIssue(issue.id);
      setIssues((current) => {
        const next = current.filter((item) => item.id !== issue.id);
        setSelectedId((selected) => (selected === issue.id ? next[0]?.id ?? null : selected));
        return next;
      });
      if (detail?.id === issue.id) {
        setDetail(null);
      }
      setMessage("Report deleted.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to delete report.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <RequireRole roles={["citizen", "authority", "admin"]}>
      <AppShell>
        <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-3 overflow-x-hidden lg:h-full lg:min-h-0 lg:overflow-hidden">
          <Card className="workspace-card shrink-0 rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Citizen Records</p>
                  <h1 className="mt-1 text-2xl font-bold text-slate-950">Your Reported History</h1>
                  <p className="text-sm text-slate-600">Search reports and review their official progress timeline.</p>
                </div>
                <div className="relative w-full lg:w-[360px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search issue, status, department..."
                    className="soft-field h-12 pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid flex-1 gap-4 overflow-visible lg:min-h-0 lg:overflow-hidden lg:grid-cols-12 lg:gap-6">
            <Card className="workspace-card flex overflow-hidden rounded-2xl border-slate-200 shadow-sm lg:col-span-5 lg:min-h-0">
              <div className="flex w-full flex-col lg:min-h-0">
              <CardHeader className="shrink-0 border-b p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Reported Issues</CardTitle>
                    <CardDescription>{filteredIssues.length} matching reports</CardDescription>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3">{issues.length}</Badge>
                </div>
                {message ? <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">{message}</p> : null}
              </CardHeader>
              <CardContent className="hide-scrollbar space-y-3 overflow-visible p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(issue.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setSelectedId(issue.id);
                      }
                    }}
                    className={cn(
                      "flex w-full flex-col gap-3 rounded-2xl border bg-white p-3 text-left transition hover:border-blue-300 sm:flex-row",
                      selectedId === issue.id ? "border-blue-500 bg-blue-50" : "border-slate-200"
                    )}
                  >
                    {issue.image_url ? (
                      <img src={issue.image_url} alt="" className="h-36 w-full shrink-0 rounded-xl object-cover sm:h-24 sm:w-28" />
                    ) : (
                      <span className="flex h-36 w-full shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 sm:h-24 sm:w-28">
                        <FileImage className="h-7 w-7" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-slate-950">{issue.title}</span>
                          <span className="text-sm text-slate-500">{categoryLabels[issue.category]}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <Badge variant="dark" className="rounded-lg capitalize">{issue.status.replace("_", " ")}</Badge>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-red-100 text-red-600 hover:bg-red-50"
                            disabled={deletingId === issue.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              void onDeleteIssue(issue);
                            }}
                            aria-label="Delete report"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </span>
                      </span>
                      <span className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <CalendarClock className="h-4 w-4" />
                        {formatDate(issue.created_at)}
                      </span>
                      <span className="mt-2 block line-clamp-2 text-sm text-slate-600">{issue.description}</span>
                    </span>
                  </div>
                ))}
                {filteredIssues.length === 0 ? (
                  <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">No reports matched your search.</p>
                ) : null}
              </CardContent>
              </div>
            </Card>

            <Card className="workspace-card flex overflow-hidden rounded-2xl border-slate-200 shadow-sm lg:col-span-7 lg:min-h-0">
              <div className="flex w-full flex-col lg:min-h-0">
              <CardHeader className="shrink-0 border-b p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <CardTitle>{detail?.title ?? "Select a report"}</CardTitle>
                    <CardDescription>{detail ? `${categoryLabels[detail.category]} issue timeline` : "Choose an issue to view tracking details."}</CardDescription>
                  </div>
                  {detail ? (
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="rounded-full capitalize">{detail.status.replace("_", " ")}</Badge>
                      <Badge variant="success" className="rounded-full">{detail.trust_score}% trust</Badge>
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="hide-scrollbar overflow-visible p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                {detail ? (
                  <div className="grid min-h-0 gap-4 xl:grid-cols-[0.85fr_1.15fr]">
                    <div className="space-y-3">
                      {detail.image_url ? (
                        <img src={detail.image_url} alt="" className="h-44 w-full rounded-2xl object-cover" />
                      ) : (
                        <div className="flex h-44 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <FileImage className="h-10 w-10" />
                        </div>
                      )}
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-bold text-slate-950">Report Summary</p>
                        <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">{detail.description}</p>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs font-bold uppercase text-slate-500">Department</p>
                            <p className="font-semibold text-slate-950">{detail.ai_department ?? "Civic Response Team"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-slate-500">Reported</p>
                            <p className="font-semibold text-slate-950">{formatDate(detail.created_at)}</p>
                          </div>
                        </div>
                      </div>
                      {detail.status === "resolved" ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-sm font-bold text-emerald-950">Resolution Update</p>
                          <p className="mt-2 text-sm leading-6 text-emerald-800">
                            {detail.resolution_public_note || detail.resolution_summary || "Your issue has been marked resolved by the authority."}
                          </p>
                          {detail.ai_resolution_confidence != null ? (
                            <div className="mt-3 rounded-2xl border border-emerald-200 bg-white/70 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">AI Repair Verification</p>
                                <p className="text-lg font-bold text-emerald-950">{detail.ai_resolution_confidence}%</p>
                              </div>
                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
                                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${detail.ai_resolution_confidence}%` }} />
                              </div>
                              <p className="mt-2 text-sm leading-6 text-emerald-800">{detail.ai_resolution_remarks ?? "Before/after proof was verified before closure."}</p>
                            </div>
                          ) : null}
                          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs font-bold uppercase text-emerald-700">Completed By</p>
                              <p className="font-semibold text-emerald-950">{detail.resolution_worker ?? "Field team"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase text-emerald-700">Completion Date</p>
                              <p className="font-semibold text-emerald-950">{detail.resolution_date ? formatDate(detail.resolution_date) : "Updated now"}</p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                          <ShieldCheck className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-bold text-slate-950">Progress Timeline</p>
                          <p className="text-sm text-slate-500">Official status history</p>
                        </div>
                      </div>

                      <div>
                        {detail.timeline.map((step, index) => (
                          <div key={step.stage} className="grid grid-cols-[28px_1fr] gap-4">
                            <div className="flex flex-col items-center">
                              <span
                                className={cn(
                                  "flex h-7 w-7 items-center justify-center rounded-full border",
                                  step.completed ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-400"
                                )}
                              >
                                {step.completed ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                              </span>
                              {index < detail.timeline.length - 1 ? (
                                <span className={cn("h-12 w-px", step.completed ? "bg-blue-300" : "bg-slate-200")} />
                              ) : null}
                            </div>
                            <div className="pb-3">
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="font-bold text-slate-950">{step.stage}</h3>
                                <p className="shrink-0 text-xs font-semibold text-slate-500">{step.date}</p>
                              </div>
                              <p className="mt-1 text-sm text-slate-500">{step.time} - {step.department}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-600">{step.remarks}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">Select a reported issue to see the full progress timeline.</p>
                )}
              </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </AppShell>
    </RequireRole>
  );
}

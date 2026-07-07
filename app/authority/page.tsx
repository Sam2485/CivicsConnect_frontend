import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileImage,
  ImageUp,
  Loader2,
  MapPin,
  Moon,
  Navigation,
  ScanSearch,
  Search,
  ShieldAlert,
  Sun,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  Wrench
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSearchParams } from "@/lib/router";
import { assignAuthorityIssue, createAuthorityWorker, createIssueResolution, deleteAuthorityWorker, fetchAuthorityProfile, getAuthorityDashboard, getAuthorityIssues, getAuthorityProfile, getAuthorityWorkers, updateAuthorityIssueStatus, updateAuthorityProfileLocation, verifyResolutionImages } from "@/lib/api";
import type { AiResolutionVerification, AuthorityDashboardData, AuthorityIssue, AuthorityWorker } from "@/lib/types";
import { cn } from "@/lib/utils";

const departments = ["Road Department", "Water Department", "Electrical Department", "Sanitation Department", "Drainage Department"];
const statuses = ["Reported", "Assigned", "In Progress", "Resolved"];
const severities = ["Critical", "High", "Medium", "Low"];
const defaultFieldWorkers = ["Arjun Mehta", "Priya Singh", "Dev Patel", "Neha Rao", "Ravi Kumar"];

type AssignmentRecord = {
  department: string;
  worker: string;
  priority: string;
  eta: string;
};

function issueCode(issue?: AuthorityIssue) {
  return issue?.display_id ?? issue?.id ?? "--";
}

function authorityDirectionsUrl(issue: AuthorityIssue, origin: { latitude: number; longitude: number }) {
  const params = new URLSearchParams({
    api: "1",
    destination: `${issue.latitude ?? ""},${issue.longitude ?? ""}`,
    travelmode: "driving"
  });
  if (Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude)) {
    params.set("origin", `${origin.latitude},${origin.longitude}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(new Date());
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read complaint image."));
    reader.readAsDataURL(blob);
  });
}

async function imageUrlToDataUrl(url: string) {
  if (!url || url.startsWith("data:")) {
    return url;
  }
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error("Saved citizen image is unreachable.");
  }
  return blobToDataUrl(await response.blob());
}

function statusTone(status: string) {
  if (status === "Resolved") return "success";
  if (status === "In Progress") return "warning";
  return "secondary";
}

function isResolvedStatus(status?: string) {
  return status?.trim().toLowerCase() === "resolved";
}

function MiniLineChart({ data }: { data: AuthorityDashboardData["resolution_rate"] }) {
  const points = data.map((item, index) => `${index * 25},${100 - item.resolved}`).join(" ");
  const pendingPoints = data.map((item, index) => `${index * 25},${100 - item.pending}`).join(" ");
  return (
    <div className="h-full min-h-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-slate-950">Monthly Resolution Rate</p>
          <p className="text-sm text-slate-500">Resolved vs pending workload.</p>
        </div>
        <Badge variant="success" className="shrink-0">88% May</Badge>
      </div>
      <svg viewBox="0 0 100 100" className="h-[210px] w-full overflow-visible">
        {[66, 72, 78, 84, 90].map((tick) => (
          <g key={tick}>
            <line x1="0" x2="100" y1={100 - tick} y2={100 - tick} stroke="#e2e8f0" strokeWidth="0.5" />
            <text x="-2" y={103 - tick} textAnchor="end" className="fill-slate-400 text-[4px]">{tick}%</text>
          </g>
        ))}
        <polyline points={pendingPoints} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((item, index) => (
          <g key={item.month}>
            <circle cx={index * 25} cy={100 - item.resolved} r="2" fill="#2563eb" />
            <text x={index * 25} y="108" textAnchor="middle" className="fill-slate-500 text-[5px]">{item.month}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function BarChart({ data }: { data: AuthorityDashboardData["department_performance"] }) {
  const max = Math.max(...data.map((item) => item.total));
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.department}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">{item.department}</span>
            <span className="text-slate-500">{item.resolved}/{item.total} resolved</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${(item.total / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Timeline({ issue }: { issue?: AuthorityIssue }) {
  if (!issue) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
          <ClipboardList className="h-5 w-5" />
        </span>
        <p className="font-bold text-slate-950">No complaint selected</p>
        <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">Choose a road assignment to preview the citizen-facing status timeline.</p>
      </div>
    );
  }

  const activeStatus = issue?.status ?? "Reported";
  const completedIndex = Math.max(0, statuses.indexOf(activeStatus));
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Citizen Timeline</p>
          <p className="mt-1 truncate font-bold text-slate-950">{issue.title}</p>
        </div>
        <Badge variant={statusTone(issue.status) as "default"} className="w-fit rounded-full">{issue.status}</Badge>
      </div>
      {["Reported", "Assigned", "In Progress", "Resolved"].map((step, index) => (
        <div key={step} className="grid grid-cols-[32px_1fr] gap-3">
          <div className="flex flex-col items-center">
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-full border", index <= completedIndex ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-400")}>
              {index <= completedIndex ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            </span>
            {index < 3 ? <span className={cn("h-12 w-px", index < completedIndex ? "bg-blue-300" : "bg-slate-200")} /> : null}
          </div>
          <div className="pb-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold text-slate-950">{step}</p>
              <p className="shrink-0 text-xs font-semibold text-slate-500">{issue.created_date}</p>
            </div>
            <p className="mt-1 text-sm text-slate-500">{issue.created_time} - {issue.department}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {step === "Reported" ? "Citizen report received with image, location, and description." : null}
              {step === "Assigned" ? "Road supervisor assigned this complaint for field inspection." : null}
              {step === "In Progress" ? "Field team timeline update is visible to the reporting citizen." : null}
              {step === "Resolved" ? "Completion proof and remarks close the citizen timeline." : null}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AuthorityPage() {
  const searchParams = useSearchParams();
  const [authorityProfile, setAuthorityProfile] = useState(getAuthorityProfile);
  const [dashboard, setDashboard] = useState<AuthorityDashboardData | null>(null);
  const [issues, setIssues] = useState<AuthorityIssue[]>([]);
  const [workers, setWorkers] = useState<AuthorityWorker[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [department, setDepartment] = useState("all");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [assignmentRecords, setAssignmentRecords] = useState<Record<string, AssignmentRecord>>({});
  const [assignmentDraft, setAssignmentDraft] = useState<AssignmentRecord>({
    department: "Road Department",
    worker: defaultFieldWorkers[0],
    priority: "High",
    eta: ""
  });
  const [workerDraft, setWorkerDraft] = useState({
    name: "",
    phone_number: "",
    role_label: "Field Worker"
  });
  const [addingWorker, setAddingWorker] = useState(false);
  const [deletingWorkerId, setDeletingWorkerId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [message, setMessage] = useState("");
  const [completionError, setCompletionError] = useState("");
  const [resolving, setResolving] = useState(false);
  const [verifyingResolution, setVerifyingResolution] = useState(false);
  const [resolutionVerification, setResolutionVerification] = useState<AiResolutionVerification | null>(null);
  const [verifiedProofKey, setVerifiedProofKey] = useState("");
  const [lockedResolvedIssueIds, setLockedResolvedIssueIds] = useState<Set<string>>(() => new Set());
  const refreshInFlightRef = useRef(false);
  const syncedAuthorityLocationRef = useRef(false);
  const [completionForm, setCompletionForm] = useState({
    issueId: "",
    beforeImage: "",
    beforeName: "",
    afterImage: "",
    afterName: "",
    summary: "",
    materials: "",
    publicNote: "",
    completionDate: "",
    fieldWorker: "",
    roadSafe: false,
    debrisCleared: false,
    citizenVisible: true
  });
  const section = searchParams.get("section") ?? "dashboard";
  const officerDepartment = authorityProfile.department;

  const refreshAuthorityWorkspace = useCallback(() => {
    if (refreshInFlightRef.current || document.visibilityState === "hidden") return;
    refreshInFlightRef.current = true;
    Promise.allSettled([fetchAuthorityProfile(), getAuthorityDashboard(), getAuthorityIssues(), getAuthorityWorkers()])
      .then(([profileResult, dashboardResult, issuesResult, workersResult]) => {
        if (profileResult.status === "fulfilled") {
          setAuthorityProfile(profileResult.value);
        } else {
          setAuthorityProfile(getAuthorityProfile());
        }
        setDashboard(dashboardResult.status === "fulfilled" ? dashboardResult.value : null);
        if (issuesResult.status === "fulfilled") {
          const items = issuesResult.value;
          setIssues(items);
          setAssignmentRecords((current) => {
            const next = { ...current };
            items.forEach((issue) => {
              if (issue.assigned_worker) {
                next[issue.id] = {
                  department: issue.department,
                  worker: issue.assigned_worker,
                  priority: issue.assignment_priority ?? issue.severity,
                  eta: issue.assignment_eta ?? ""
                };
              }
            });
            return next;
          });
          setSelectedIssueId((current) => {
            if (current && items.some((issue) => issue.id === current)) {
              return current;
            }
            return items[0]?.id ?? null;
          });
        } else {
          setIssues([]);
        }
        setWorkers(workersResult.status === "fulfilled" ? workersResult.value : []);
      })
      .finally(() => {
        refreshInFlightRef.current = false;
      });
  }, []);

  useEffect(() => {
    refreshAuthorityWorkspace();
    const timer = window.setInterval(refreshAuthorityWorkspace, 5000);
    return () => window.clearInterval(timer);
  }, [refreshAuthorityWorkspace]);

  useEffect(() => {
    const resolvedIds = issues.filter((issue) => isResolvedStatus(issue.status)).map((issue) => issue.id);
    if (resolvedIds.length === 0) return;
    setLockedResolvedIssueIds((current) => {
      const next = new Set(current);
      let changed = false;
      resolvedIds.forEach((id) => {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [issues]);

  useEffect(() => {
    if (syncedAuthorityLocationRef.current || !("geolocation" in navigator)) {
      return;
    }
    syncedAuthorityLocationRef.current = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextProfile = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6))
        };
        updateAuthorityProfileLocation(nextProfile)
          .then((profile) => {
            setAuthorityProfile(profile);
            refreshAuthorityWorkspace();
          })
          .catch(() => undefined);
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 8000 }
    );
  }, [refreshAuthorityWorkspace]);

  const visibleIssues = useMemo(
    () =>
      issues.map((issue) =>
        lockedResolvedIssueIds.has(issue.id) || isResolvedStatus(issue.status)
          ? { ...issue, status: "Resolved" }
          : issue
      ),
    [issues, lockedResolvedIssueIds]
  );

  const filteredIssues = useMemo(() => {
    const search = query.trim().toLowerCase();
    return visibleIssues.filter((issue) => {
      const matchesSearch = !search || Object.values(issue).join(" ").toLowerCase().includes(search);
      return (
        matchesSearch &&
        (category === "all" || issue.category === category) &&
        (status === "all" || issue.status === status) &&
        (severity === "all" || issue.severity === severity) &&
        (department === "all" || issue.department === department)
      );
    });
  }, [category, department, query, severity, status, visibleIssues]);

  const selectedIssue = visibleIssues.find((issue) => issue.id === selectedIssueId) ?? visibleIssues[0];
  const selectedIssueResolved = Boolean(selectedIssue && (lockedResolvedIssueIds.has(selectedIssue.id) || isResolvedStatus(selectedIssue.status)));
  const selectedIssueReadOnly = selectedIssueResolved || resolving;
  const selectedAssignment = selectedIssue ? assignmentRecords[selectedIssue.id] : undefined;
  const displayedResolutionVerification: AiResolutionVerification | null =
    resolutionVerification ??
    (selectedIssue?.ai_resolution_confidence != null
      ? {
          resolved: Boolean(selectedIssue.ai_resolution_resolved),
          confidence: selectedIssue.ai_resolution_confidence,
          remarks: selectedIssue.ai_resolution_remarks ?? "AI verification completed.",
          visual_improvements: [],
          requires_rework: !selectedIssue.ai_resolution_resolved
        }
      : null);
  const departmentIssues = visibleIssues;
  const departmentKpis = useMemo(() => {
    const open = departmentIssues.filter((issue) => issue.status === "Reported" || issue.status === "Assigned").length;
    const inProgress = departmentIssues.filter((issue) => issue.status === "In Progress").length;
    const resolved = departmentIssues.filter((issue) => issue.status === "Resolved").length;
    const critical = departmentIssues.filter((issue) => issue.severity === "Critical").length;
    return {
      total_issues: { count: departmentIssues.length, change: 8.4 },
      open_issues: { count: open, change: -3.1 },
      in_progress: { count: inProgress, change: 5.8 },
      resolved_issues: { count: resolved, change: 12.2 },
      critical: { count: critical, change: -1.5 }
    };
  }, [departmentIssues]);
  const departmentPerformance = dashboard?.department_performance.filter((item) => item.department === officerDepartment) ?? [];
  const departmentWorkers = useMemo(
    () => workers.filter((worker) => worker.department === assignmentDraft.department || worker.department === officerDepartment),
    [assignmentDraft.department, officerDepartment, workers]
  );
  const workerNames = useMemo(
    () => (departmentWorkers.length ? departmentWorkers.map((worker) => worker.name) : defaultFieldWorkers),
    [departmentWorkers]
  );
  const showDashboard = section === "dashboard" || section === "analytics";
  const showComplaints = section === "complaints";
  const showAssignments = section === "assignments";
  const showWorkers = section === "workers";
  const showCompletion = section === "completion";
  const showReports = section === "reports";
  const completionMatchesSelected = Boolean(selectedIssue && completionForm.issueId === selectedIssue.id);
  const activeBeforeImage = completionMatchesSelected ? completionForm.beforeImage : "";
  const activeAfterImage = completionMatchesSelected ? completionForm.afterImage : "";
  const missingResolutionItems = [
    !selectedIssue ? "Select an issue" : null,
    !activeBeforeImage ? "Before proof image" : null,
    !activeAfterImage ? "After proof image" : null,
    completionForm.summary.trim().length < 10 ? "Resolution summary" : null,
    !completionForm.completionDate ? "Completion date" : null,
    !completionForm.fieldWorker.trim() ? "Field worker" : null,
    !completionForm.roadSafe ? "Road safety checked" : null,
    !completionForm.debrisCleared ? "Debris cleared checked" : null,
    !completionForm.citizenVisible ? "Citizen publish checked" : null
  ].filter(Boolean) as string[];
  const canSubmitResolution = !selectedIssueResolved && missingResolutionItems.length === 0 && !resolving && !verifyingResolution;
  const beforeProofReady = Boolean(activeBeforeImage);
  const proofReady = Boolean(beforeProofReady && activeAfterImage);
  const currentProofKey = proofReady
    ? `${selectedIssue?.id}:${activeBeforeImage.length}:${activeBeforeImage.slice(0, 48)}:${activeAfterImage.length}:${activeAfterImage.slice(0, 48)}`
    : "";

  function openSelectedIssueDirections() {
    if (!selectedIssue || !Number.isFinite(selectedIssue.latitude) || !Number.isFinite(selectedIssue.longitude)) {
      return;
    }
    window.open(
      authorityDirectionsUrl(selectedIssue, {
        latitude: authorityProfile.latitude,
        longitude: authorityProfile.longitude
      }),
      "_blank",
      "noopener,noreferrer"
    );
  }

  useEffect(() => {
    if (!selectedIssue) {
      setCompletionForm((current) => ({
        ...current,
        issueId: "",
        beforeImage: "",
        beforeName: "",
        afterImage: "",
        afterName: "",
        summary: "",
        materials: "",
        publicNote: "",
        completionDate: "",
        fieldWorker: "",
        roadSafe: false,
        debrisCleared: false,
        citizenVisible: true
      }));
      setResolutionVerification(null);
      setVerifiedProofKey("");
      return;
    }

    let active = true;
    const beforeSource = selectedIssue.resolution_before_image || selectedIssue.image_url || "";
    const afterSource = selectedIssue.resolution_after_image || "";
    setCompletionForm((current) => ({
      ...current,
      issueId: selectedIssue.id,
      beforeImage: beforeSource,
      beforeName: beforeSource ? "Citizen complaint image" : "",
      afterImage: afterSource,
      afterName: afterSource ? "Completion proof image" : "",
      summary: selectedIssue.resolution_summary ?? "",
      materials: selectedIssue.resolution_materials ?? "",
      publicNote: selectedIssue.resolution_public_note ?? "",
      completionDate: selectedIssue.resolution_date ?? "",
      fieldWorker: selectedIssue.resolution_worker ?? current.fieldWorker,
      roadSafe: selectedIssueResolved,
      debrisCleared: selectedIssueResolved,
      citizenVisible: true
    }));
    setResolutionVerification(null);
    setVerifiedProofKey("");

    if (beforeSource && !beforeSource.startsWith("data:")) {
      imageUrlToDataUrl(beforeSource)
        .then((dataUrl) => {
          if (!active) return;
          setCompletionForm((current) => ({
            ...current,
            issueId: selectedIssue.id,
            beforeImage: dataUrl,
            beforeName: "Citizen complaint image"
          }));
        })
        .catch((err) => {
          if (!active) return;
          setCompletionForm((current) => ({
            ...current,
            issueId: selectedIssue.id,
            beforeImage: beforeSource,
            beforeName: "Citizen complaint image"
          }));
          setCompletionError(
            err instanceof Error
              ? `${err.message} Upload or replace the Before Repair image to continue.`
              : "Saved citizen image is unreachable. Upload or replace the Before Repair image to continue."
          );
        });
    }

    return () => {
      active = false;
    };
  }, [
    selectedIssue?.id,
    selectedIssue?.image_url,
    selectedIssue?.resolution_before_image,
    selectedIssue?.resolution_after_image,
    selectedIssue?.resolution_summary,
    selectedIssue?.resolution_public_note,
    selectedIssue?.resolution_worker,
    selectedIssue?.resolution_date,
    selectedIssue?.resolution_materials,
    selectedIssueResolved
  ]);

  useEffect(() => {
    if (!selectedIssue) return;
    const record = assignmentRecords[selectedIssue.id] ?? {
      department: selectedIssue.department,
      worker: selectedIssue.assigned_worker || workerNames[0] || "",
      priority: selectedIssue.severity,
      eta: selectedIssue.assignment_eta ?? ""
    };
    setAssignmentDraft(record);
  }, [assignmentRecords, selectedIssue, workerNames]);

  async function runAction(action: "assign" | "status" | "resolution", verification?: AiResolutionVerification | null) {
    if (!selectedIssue) return;
    if (selectedIssueResolved) {
      setMessage("Resolved records are read-only and cannot be updated.");
      window.setTimeout(() => setMessage(""), 5000);
      return;
    }
    const updatedStatus = action === "resolution" ? "Resolved" : selectedIssue.status;
    const result =
      action === "assign"
        ? await assignAuthorityIssue(selectedIssue.id)
        : action === "status"
          ? await updateAuthorityIssueStatus(selectedIssue.id)
          : await createIssueResolution(selectedIssue.id, {
              summary: completionForm.summary.trim(),
              public_note: completionForm.publicNote.trim(),
              field_worker: completionForm.fieldWorker.trim(),
              completion_date: completionForm.completionDate,
              materials: completionForm.materials.trim(),
              before_image: activeBeforeImage,
              after_image: activeAfterImage,
              ai_resolved: verification?.resolved ?? resolutionVerification?.resolved,
              ai_confidence: verification?.confidence ?? resolutionVerification?.confidence,
              ai_remarks: verification?.remarks ?? resolutionVerification?.remarks
            });
    if (action === "resolution") {
      setLockedResolvedIssueIds((current) => {
        const next = new Set(current);
        next.add(selectedIssue.id);
        return next;
      });
    }
    if (updatedStatus !== selectedIssue.status) {
      setIssues((current) => current.map((issue) => (issue.id === selectedIssue.id ? { ...issue, status: updatedStatus } : issue)));
    }
    setMessage(result.message);
    window.setTimeout(() => setMessage(""), 5000);
  }

  async function assignSelectedIssue() {
    if (!selectedIssue) return;
    if (selectedIssueResolved) {
      setMessage("Resolved records are read-only and cannot be updated.");
      window.setTimeout(() => setMessage(""), 5000);
      return;
    }
    const result = await assignAuthorityIssue(selectedIssue.id, {
      field_worker: assignmentDraft.worker,
      priority: assignmentDraft.priority,
      eta: assignmentDraft.eta || undefined
    });
    const shouldAdvanceTimeline = !selectedIssueResolved;
    setAssignmentRecords((current) => ({ ...current, [selectedIssue.id]: assignmentDraft }));
    setIssues((current) =>
      current.map((issue) =>
        issue.id === selectedIssue.id
          ? {
              ...issue,
              status: issue.status === "Resolved" ? issue.status : "In Progress"
            }
          : issue
      )
    );
    setMessage(
      `${result.message}: ${assignmentDraft.worker}${assignmentDraft.eta ? `, ETA ${assignmentDraft.eta}` : ""}${
        shouldAdvanceTimeline ? ". Timeline moved to In Progress." : ""
      }`
    );
    window.setTimeout(() => setMessage(""), 5000);
  }

  function attachCompletionImage(file: File | undefined, type: "before" | "after") {
    if (!file || selectedIssueReadOnly) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = String(reader.result);
      setCompletionForm((current) => ({
        ...current,
        issueId: selectedIssue?.id ?? current.issueId,
        [type === "before" ? "beforeImage" : "afterImage"]: image,
        [type === "before" ? "beforeName" : "afterName"]: file.name
      }));
      setCompletionError("");
      setResolutionVerification(null);
      setVerifiedProofKey("");
    };
    reader.readAsDataURL(file);
  }

  async function addWorker() {
    const name = workerDraft.name.trim();
    if (!name) {
      setMessage("Enter worker name.");
      window.setTimeout(() => setMessage(""), 3500);
      return;
    }
    setAddingWorker(true);
    try {
      const worker = await createAuthorityWorker({
        name,
        department: officerDepartment,
        phone_number: workerDraft.phone_number.trim() || undefined,
        role_label: workerDraft.role_label.trim() || undefined
      });
      setWorkers((current) => [worker, ...current]);
      setAssignmentDraft((current) => ({ ...current, department: worker.department, worker: worker.name }));
      setWorkerDraft({ name: "", phone_number: "", role_label: "Field Worker" });
      setMessage(`${worker.name} added to ${worker.department}.`);
      window.setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to add worker.");
      window.setTimeout(() => setMessage(""), 5000);
    } finally {
      setAddingWorker(false);
    }
  }

  async function removeWorker(worker: AuthorityWorker) {
    const confirmed = window.confirm(`Delete ${worker.name} from ${worker.department}?`);
    if (!confirmed) return;
    setDeletingWorkerId(worker.id);
    try {
      await deleteAuthorityWorker(worker.id);
      const remainingWorkers = workers.filter((item) => item.id !== worker.id);
      setWorkers(remainingWorkers);
      const nextWorker = remainingWorkers.find((item) => item.department === worker.department)?.name ?? defaultFieldWorkers[0];
      setAssignmentDraft((current) => (current.worker === worker.name ? { ...current, worker: nextWorker } : current));
      setMessage(`${worker.name} deleted from ${worker.department}.`);
      window.setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to delete worker.");
      window.setTimeout(() => setMessage(""), 5000);
    } finally {
      setDeletingWorkerId(null);
    }
  }

  async function runResolutionVerification() {
    if (selectedIssueResolved) {
      setCompletionError("This issue is resolved. Resolution records are available in read-only mode.");
      return null;
    }
    if (!beforeProofReady || !activeAfterImage) {
      setCompletionError(beforeProofReady ? "Upload the authority after repair image before AI verification." : "Citizen before image is missing. Upload or replace the Before Repair image before AI verification.");
      return null;
    }
    setCompletionError("");
    setVerifyingResolution(true);
    try {
      const verification = await verifyResolutionImages(activeBeforeImage, activeAfterImage);
      setResolutionVerification(verification);
      setVerifiedProofKey(currentProofKey);
      if (!verification.resolved || verification.confidence < 70) {
        setCompletionError(`AI verification confidence is ${verification.confidence}%. ${verification.remarks}`);
      }
      return verification;
    } catch (err) {
      setCompletionError(err instanceof Error ? err.message : "Unable to run AI before/after verification.");
      return null;
    } finally {
      setVerifyingResolution(false);
    }
  }

  useEffect(() => {
    if (selectedIssueResolved || !proofReady || verifyingResolution || verifiedProofKey === currentProofKey) return;
    const timer = window.setTimeout(() => {
      void runResolutionVerification();
    }, 350);
    return () => window.clearTimeout(timer);
  }, [currentProofKey, proofReady, selectedIssueResolved, verifiedProofKey, verifyingResolution]);

  async function submitResolution() {
    setCompletionError("");
    if (selectedIssueResolved) {
      setCompletionError("This issue is resolved. Resolution records are available in read-only mode.");
      return;
    }
    if (missingResolutionItems.length > 0) {
      setCompletionError(`Complete before resolving: ${missingResolutionItems.join(", ")}.`);
      return;
    }
    setResolving(true);
    try {
      const verification = verifiedProofKey === currentProofKey && resolutionVerification
        ? resolutionVerification
        : await runResolutionVerification();
      if (!verification) return;
      if (!verification.resolved || verification.confidence < 70) {
        setCompletionError(`AI verification confidence is ${verification.confidence}%. ${verification.remarks}`);
        return;
      }
      await runAction("resolution", verification);
      if (selectedIssue) {
        setLockedResolvedIssueIds((current) => {
          const next = new Set(current);
          next.add(selectedIssue.id);
          return next;
        });
        setIssues((current) =>
          current.map((issue) =>
            issue.id === selectedIssue.id
              ? {
                  ...issue,
                  status: "Resolved",
                  resolution_summary: completionForm.summary.trim(),
                  resolution_public_note: completionForm.publicNote.trim(),
                  resolution_worker: completionForm.fieldWorker.trim(),
                  resolution_date: completionForm.completionDate,
                  resolution_materials: completionForm.materials.trim(),
                  resolution_before_image: activeBeforeImage,
                  resolution_after_image: activeAfterImage,
                  ai_resolution_resolved: verification.resolved,
                  ai_resolution_confidence: verification.confidence,
                  ai_resolution_remarks: verification.remarks
                }
              : issue
          )
        );
      }
      setCompletionError("");
    } catch (err) {
      setCompletionError(err instanceof Error ? err.message : "Unable to mark this issue resolved.");
    } finally {
      setVerifyingResolution(false);
      setResolving(false);
    }
  }

  const shellTone = darkMode ? "bg-slate-950 text-white" : "text-slate-950";

  return (
    <RequireRole roles={["authority", "admin"]}>
      <AppShell>
        <div className={cn("min-h-[calc(100dvh-8rem)] overflow-x-hidden rounded-3xl transition-colors lg:min-h-[calc(100vh-3rem)]", shellTone)}>
          <div className="grid gap-5">
            <main className="min-w-0 space-y-5">
              <Card className={cn("workspace-card rounded-3xl", darkMode && "border-slate-800 bg-slate-900/90")}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative min-w-0 flex-1 lg:max-w-xl">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search complaint, citizen, department..." className="soft-field h-12 pl-10" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="h-10 rounded-2xl px-4">{officerDepartment}</Badge>
                      <Badge variant="secondary" className="h-10 rounded-2xl px-4">{authorityProfile.zone}</Badge>
                      <Badge variant="secondary" className="h-10 rounded-2xl px-4">{authorityProfile.radius_km} km radius</Badge>
                      <Badge variant="success" className="h-10 rounded-2xl px-4">{todayLabel()}</Badge>
                      <Button variant="outline" size="icon" className="h-10 w-10"><Bell className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setDarkMode((value) => !value)}>
                        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </Button>
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-bold text-white">A</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {showDashboard ? <section className="grid gap-4 overflow-visible lg:h-[calc(100vh-9.5rem)] lg:min-h-0 lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="grid min-w-0 gap-4 overflow-visible lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden">
                  <Card className={cn("workspace-card shrink-0 overflow-hidden rounded-2xl", darkMode && "border-slate-800 bg-slate-900/90")}>
                    <CardContent className="p-0">
                      <div className="grid min-w-0 divide-y divide-slate-200 md:grid-cols-[1.1fr_repeat(4,minmax(0,0.8fr))] md:divide-x md:divide-y-0">
                        <div className="min-w-0 bg-slate-950 p-4 text-white">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Authority Command</p>
                          <h2 className="mt-2 truncate text-xl font-bold">{officerDepartment}</h2>
                          <p className="mt-1 text-sm text-slate-300">{authorityProfile.zone} - {authorityProfile.radius_km} km service area.</p>
                        </div>
                        {[
                          ["Total", departmentKpis.total_issues, "All assigned work"],
                          ["Open", departmentKpis.open_issues, "Awaiting action"],
                          ["In Progress", departmentKpis.in_progress, "Field activity"],
                          ["Resolved", departmentKpis.resolved_issues, "Closed this cycle"]
                        ].map(([label, metric, helper]) => {
                          const typedMetric = metric as { count: number; change: number } | undefined;
                          return (
                            <div key={String(label)} className="min-w-0 bg-white p-4">
                              <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{String(label)}</p>
                              <div className="mt-2 flex items-end justify-between gap-2">
                                <p className="text-3xl font-bold text-slate-950">{typedMetric?.count ?? 0}</p>
                                <p className={cn("shrink-0 text-xs font-bold", (typedMetric?.change ?? 0) >= 0 ? "text-emerald-600" : "text-red-600")}>
                                  {(typedMetric?.change ?? 0) >= 0 ? "+" : ""}{typedMetric?.change ?? 0}%
                                </p>
                              </div>
                              <p className="mt-2 truncate text-xs text-slate-500">{String(helper)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <section className="grid min-w-0 gap-4 overflow-visible lg:min-h-0 lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                    <Card className={cn("workspace-card flex min-w-0 flex-col overflow-hidden rounded-2xl lg:min-h-0", darkMode && "border-slate-800 bg-slate-900/90")}>
                      <CardHeader className="shrink-0 border-b p-4">
                        <CardTitle>Performance Trend</CardTitle>
                        <CardDescription>Resolution rate and pending movement.</CardDescription>
                      </CardHeader>
                      <CardContent className="min-h-0 flex-1 p-4">
                        {dashboard ? <MiniLineChart data={dashboard.resolution_rate} /> : null}
                      </CardContent>
                    </Card>

                    <Card className={cn("workspace-card flex min-w-0 flex-col overflow-hidden rounded-2xl lg:min-h-0", darkMode && "border-slate-800 bg-slate-900/90")}>
                      <CardHeader className="shrink-0 border-b p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle>Service Queue</CardTitle>
                            <CardDescription>Operational list for assignment and follow-up.</CardDescription>
                          </div>
                          <Badge variant="secondary" className="shrink-0">{departmentIssues.length} active</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="hide-scrollbar p-0 sm:overflow-x-auto lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                        <div className="hidden min-w-[620px] grid-cols-[88px_minmax(0,1fr)_110px_96px] gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-500 sm:grid">
                          <span>ID</span>
                          <span>Issue</span>
                          <span>Status</span>
                          <span>Priority</span>
                        </div>
                        <div className="divide-y">
                          {departmentIssues.slice(0, 9).map((issue) => (
                            <button
                              key={issue.id}
                              type="button"
                              onClick={() => setSelectedIssueId(issue.id)}
                              className="grid w-full grid-cols-1 gap-2 border-b px-4 py-3 text-left text-sm transition hover:bg-blue-50 sm:min-w-[620px] sm:grid-cols-[88px_minmax(0,1fr)_110px_96px] sm:items-center"
                            >
                              <span className="font-bold text-blue-600">{issueCode(issue)}</span>
                              <span className="min-w-0">
                                <span className="block font-semibold leading-5 text-slate-950 sm:truncate">{issue.title}</span>
                                <span className="block text-xs leading-5 text-slate-500 sm:truncate">{issue.location}</span>
                              </span>
                              <span className="flex flex-wrap items-center gap-2">
                                <Badge variant={statusTone(issue.status) as "default"}>{issue.status}</Badge>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 sm:hidden">{issue.severity}</span>
                              </span>
                              <span className="hidden truncate font-semibold text-slate-700 sm:block">{issue.severity}</span>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </section>
                </div>

                <aside className="grid min-w-0 gap-4 overflow-visible lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:overflow-hidden">
                  <Card className={cn("workspace-card shrink-0 rounded-2xl", darkMode && "border-slate-800 bg-slate-900/90")}>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle>Attention</CardTitle>
                      <CardDescription>Items that should stay visible.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3 p-4 pt-2">
                      <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                        <p className="text-xs font-bold uppercase text-red-700">Critical</p>
                        <p className="mt-1 text-2xl font-bold text-red-900">{departmentKpis.critical.count}</p>
                      </div>
                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                        <p className="text-xs font-bold uppercase text-amber-700">Open</p>
                        <p className="mt-1 text-2xl font-bold text-amber-900">{departmentKpis.open_issues.count}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={cn("workspace-card flex flex-col overflow-hidden rounded-2xl lg:min-h-0", darkMode && "border-slate-800 bg-slate-900/90")}>
                    <CardHeader className="shrink-0 border-b p-4">
                      <CardTitle>Activity Feed</CardTitle>
                      <CardDescription>Authority desk events.</CardDescription>
                    </CardHeader>
                    <CardContent className="hide-scrollbar space-y-3 overflow-visible p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                      {dashboard?.notifications.map((item) => (
                        <div key={item.title} className="border-l-2 border-blue-600 pl-3 text-sm">
                          <p className="font-bold text-slate-950">{item.title}</p>
                          <p className="mt-1 text-slate-500">{item.detail}</p>
                          <p className="mt-2 text-xs font-semibold text-slate-400">{item.time}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className={cn("workspace-card shrink-0 rounded-2xl", darkMode && "border-slate-800 bg-slate-900/90")}>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle>Branch Performance</CardTitle>
                      <CardDescription>{authorityProfile.zone} - {authorityProfile.radius_km} km radius</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      {dashboard ? <BarChart data={departmentPerformance.length ? departmentPerformance : dashboard.department_performance.slice(0, 1)} /> : null}
                    </CardContent>
                  </Card>
                </aside>
              </section> : null}

              {showComplaints ? <section className="grid gap-5 overflow-visible lg:h-[calc(100vh-9.5rem)] lg:min-h-0 lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
                <Card className={cn("workspace-card flex flex-col overflow-hidden rounded-3xl lg:min-h-0", darkMode && "border-slate-800 bg-slate-900/90")}>
                  <CardHeader className="shrink-0 border-b p-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <CardTitle>Area Complaint Register</CardTitle>
                        <CardDescription>All citizen complaints registered across the municipal area.</CardDescription>
                      </div>
                      <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-[520px] xl:grid-cols-4">
                        <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{["Pothole", "Water Leakage", "Streetlight", "Garbage", "Drainage"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
                        <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{statuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
                        <Select value={severity} onValueChange={setSeverity}><SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger><SelectContent><SelectItem value="all">All Severity</SelectItem>{severities.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
                        <Select value={department} onValueChange={setDepartment}><SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger><SelectContent><SelectItem value="all">All Depts</SelectItem>{departments.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col p-0 sm:overflow-x-auto lg:min-h-0 lg:flex-1">
                    <div className={cn("hidden min-w-[720px] shrink-0 grid-cols-[72px_minmax(0,1.4fr)_115px_118px_96px] gap-3 border-b px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] sm:grid", darkMode ? "bg-slate-950/70 text-slate-300" : "bg-slate-50 text-slate-500")}>
                      <span>ID</span>
                      <span>Complaint</span>
                      <span>Severity</span>
                      <span>Department</span>
                      <span>Status</span>
                    </div>
                    <div className="hide-scrollbar p-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                      <div className="space-y-2">
                        {filteredIssues.map((issue) => (
                          <button
                            key={issue.id}
                            type="button"
                            onClick={() => setSelectedIssueId(issue.id)}
                            className={cn(
                              "grid w-full grid-cols-1 gap-3 rounded-2xl border p-3 text-left text-sm transition hover:border-blue-200 hover:bg-blue-50/60 sm:min-w-[720px] sm:grid-cols-[72px_minmax(0,1.4fr)_115px_118px_96px] sm:items-center",
                              selectedIssue?.id === issue.id ? "border-blue-300 bg-blue-50 shadow-sm" : "border-slate-200 bg-white/80",
                              darkMode && "border-slate-800 bg-slate-900"
                            )}
                          >
                            <span className="font-bold text-blue-600">{issueCode(issue)}</span>
                            <span className="min-w-0">
                              <span className="block font-bold leading-5 text-slate-950 sm:truncate">{issue.title}</span>
                              <span className="block truncate text-xs text-slate-500">{issue.category} • {issue.citizen} • {issue.created_date}</span>
                            </span>
                            <span className="flex flex-wrap gap-2">
                              <Badge variant={issue.severity === "Critical" ? "warning" : "secondary"}>{issue.severity}</Badge>
                              <Badge variant={statusTone(issue.status) as "default"} className="sm:hidden">{issue.status}</Badge>
                            </span>
                            <span className="font-semibold text-slate-700 sm:truncate">{issue.department.replace(" Department", "")}</span>
                            <span className="hidden sm:block"><Badge variant={statusTone(issue.status) as "default"}>{issue.status}</Badge></span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-between border-t px-4 py-3 text-sm text-slate-500">
                      <span>Showing {filteredIssues.length} registered complaints</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">Area-wide</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="overflow-visible lg:min-h-0 lg:overflow-hidden">
                  <Card className={cn("workspace-card flex h-full flex-col overflow-hidden rounded-3xl lg:min-h-0", darkMode && "border-slate-800 bg-slate-900/90")}>
                    <CardHeader className="p-4">
                      <CardTitle>Issue Details</CardTitle>
                      <CardDescription>{selectedIssue ? issueCode(selectedIssue) : "Select an issue"} command view</CardDescription>
                    </CardHeader>
                    <CardContent className="hide-scrollbar space-y-4 overflow-visible p-4 pt-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                      {selectedIssue?.image_url ? (
                        <img src={selectedIssue.image_url} alt="" className="h-56 w-full rounded-2xl object-cover" />
                      ) : (
                        <div className="flex h-56 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <FileImage className="h-10 w-10" />
                        </div>
                      )}
                      <div className="space-y-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <Badge variant="secondary" className="mb-2 rounded-full">{selectedIssue ? issueCode(selectedIssue) : "--"}</Badge>
                            <p className="text-lg font-bold leading-6">{selectedIssue?.title}</p>
                          </div>
                          <Button
                            type="button"
                            className="blue-action w-full shrink-0 sm:w-auto"
                            disabled={!selectedIssue?.latitude || !selectedIssue.longitude}
                            onClick={openSelectedIssueDirections}
                          >
                            <Navigation className="h-4 w-4" />
                            Direction
                          </Button>
                        </div>
                        <p className={cn("text-sm leading-6", darkMode ? "text-slate-400" : "text-slate-600")}>{selectedIssue?.description}</p>
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">
                          <p className="font-bold">Dispatch note</p>
                          <p className="mt-1 leading-6">
                            Use the direction button to open Google Maps from this authority service point to the reported GPS location.
                            The complaint is {selectedIssue?.distance ?? 0} km from the active authority profile and has {selectedIssue?.trust_score ?? 0}% community trust.
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-3 text-sm sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Location</p><p className="font-semibold">{selectedIssue?.location}</p></div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Reporter</p><p className="font-semibold">{selectedIssue?.citizen}</p></div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Department</p><p className="font-semibold">{selectedIssue?.department}</p></div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Verified</p><p className="font-semibold">{selectedIssue?.verification_count} users</p></div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Status</p><p className="font-semibold">{selectedIssue?.status}</p></div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Priority</p><p className="font-semibold">{selectedIssue?.severity}</p></div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Distance</p><p className="font-semibold">{selectedIssue?.distance ?? 0} km</p></div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Trust</p><p className="font-semibold">{selectedIssue?.trust_score ?? 0}%</p></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section> : null}

              {showWorkers ? <section className="grid gap-5 overflow-visible lg:h-[calc(100vh-9.5rem)] lg:min-h-0 lg:overflow-hidden xl:grid-cols-[minmax(380px,0.72fr)_minmax(0,1fr)]">
                <Card className={cn("workspace-card flex flex-col overflow-hidden rounded-2xl lg:min-h-0", darkMode && "border-slate-800 bg-slate-900/90")}>
                  <CardHeader className="shrink-0 border-b p-0">
                    <div className="bg-slate-950 p-5 text-white">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Worker Registry</p>
                          <CardTitle className="mt-2 text-2xl text-white">Add Field Worker</CardTitle>
                          <CardDescription className="mt-1 text-slate-300">Create dispatch-ready workers for {officerDepartment}.</CardDescription>
                        </div>
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-lg">
                          <UserPlus className="h-5 w-5" />
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="hide-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
                    <div className="mb-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Department</p>
                        <p className="mt-2 truncate text-lg font-bold text-slate-950">{officerDepartment}</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Active</p>
                        <p className="mt-2 text-lg font-bold text-slate-950">{departmentWorkers.length} workers</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Scope</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">Assignment System only</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="grid gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Worker Name</Label>
                          <Input className="soft-field h-12 rounded-xl" value={workerDraft.name} onChange={(event) => setWorkerDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Enter field worker name" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Phone Number</Label>
                          <Input className="soft-field h-12 rounded-xl" value={workerDraft.phone_number} onChange={(event) => setWorkerDraft((current) => ({ ...current, phone_number: event.target.value }))} placeholder="+91 99999 99999" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Role</Label>
                          <Input className="soft-field h-12 rounded-xl" value={workerDraft.role_label} onChange={(event) => setWorkerDraft((current) => ({ ...current, role_label: event.target.value }))} placeholder="Field Worker" />
                        </div>
                        <Button type="button" className="blue-action h-12 rounded-xl text-base" disabled={addingWorker} onClick={() => void addWorker()}>
                          {addingWorker ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                          Add Worker
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={cn("workspace-card flex flex-col overflow-hidden rounded-2xl lg:min-h-0", darkMode && "border-slate-800 bg-slate-900/90")}>
                  <CardHeader className="shrink-0 border-b p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Dispatch Team</p>
                        <CardTitle className="mt-1">{officerDepartment} Workers</CardTitle>
                        <CardDescription>{departmentWorkers.length} active workers available for field assignment.</CardDescription>
                      </div>
                      <Badge variant="secondary" className="w-fit rounded-full px-3">{departmentWorkers.length} active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="hide-scrollbar overflow-visible p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                    {departmentWorkers.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                        {departmentWorkers.map((worker) => (
                          <div key={worker.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                            <div className="mb-4 flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                                  {worker.name.slice(0, 1).toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-lg font-bold text-slate-950">{worker.name}</p>
                                  <p className="truncate text-sm font-semibold text-blue-700">{worker.role_label || "Field Worker"}</p>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <Badge variant="success" className="rounded-full">Active</Badge>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 rounded-xl border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                  onClick={() => void removeWorker(worker)}
                                  disabled={deletingWorkerId === worker.id}
                                  aria-label={`Delete ${worker.name}`}
                                  title={`Delete ${worker.name}`}
                                >
                                  {deletingWorkerId === worker.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                            <div className="grid gap-2 text-sm">
                              <p className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700"><span className="font-bold text-slate-950">Department:</span> {worker.department}</p>
                              <p className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700"><span className="font-bold text-slate-950">Phone:</span> {worker.phone_number || "Not provided"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                          <UserPlus className="h-6 w-6" />
                        </span>
                        <p className="font-bold text-slate-950">No workers added</p>
                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Add field workers for this department, then assign complaints to them from the Assignments tab.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section> : null}

              {showAssignments ? <section className="grid gap-5 overflow-visible lg:h-[calc(100vh-9.5rem)] lg:min-h-0 lg:overflow-hidden xl:grid-cols-[minmax(300px,0.8fr)_minmax(360px,1fr)_minmax(380px,0.95fr)]">
                <Card className={cn("workspace-card flex flex-col overflow-hidden rounded-3xl lg:min-h-0", darkMode && "border-slate-800 bg-slate-900/90")}>
                  <CardHeader className="shrink-0 border-b border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>Road Assignments</CardTitle>
                        <CardDescription>{departmentIssues.length} complaints in this authority queue.</CardDescription>
                      </div>
                      <Badge variant="secondary" className="rounded-full px-3">{departmentIssues.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="hide-scrollbar space-y-3 overflow-visible p-4 pt-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                    {departmentIssues.length === 0 ? (
                      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                          <Wrench className="h-5 w-5" />
                        </span>
                        <p className="font-bold text-slate-950">No assignments yet</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">New routed road complaints will appear here automatically.</p>
                      </div>
                    ) : null}
                    {departmentIssues.map((issue) => (
                      <button
                        key={issue.id}
                        type="button"
                        onClick={() => setSelectedIssueId(issue.id)}
                        className={cn(
                          "w-full rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md",
                          selectedIssue?.id === issue.id ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"
                        )}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block text-base font-bold leading-5 text-slate-950">{issue.title}</span>
                            <span className="mt-1 block text-xs font-bold uppercase tracking-[0.12em] text-blue-600">{issueCode(issue)}</span>
                          </span>
                          <Badge variant={statusTone(issue.status) as "default"} className="shrink-0 rounded-full">{issue.status}</Badge>
                        </span>
                        <span className="mt-2 block text-sm text-slate-500">{issue.location} • {issue.created_date}</span>
                        {assignmentRecords[issue.id] ? (
                          <span className="mt-4 grid gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">
                            <span className="flex items-center gap-2"><Users className="h-4 w-4" />{assignmentRecords[issue.id].worker}</span>
                            <span className="font-medium text-emerald-700">
                              {assignmentRecords[issue.id].priority} priority
                              {assignmentRecords[issue.id].eta ? ` - ETA ${assignmentRecords[issue.id].eta}` : ""}
                            </span>
                          </span>
                        ) : (
                          <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Ready for dispatch</span>
                        )}
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card className={cn("workspace-card flex flex-col overflow-hidden rounded-3xl lg:min-h-0", darkMode && "border-slate-800 bg-slate-900/90")}>
                  <CardHeader className="shrink-0 border-b border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>Status Timeline</CardTitle>
                        <CardDescription>{selectedIssue ? `${issueCode(selectedIssue)} syncs to citizen history.` : "Select a complaint to preview progress."}</CardDescription>
                      </div>
                      <Badge variant={selectedIssue ? "success" : "secondary"} className="rounded-full">{selectedIssue ? "Live" : "Preview"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="hide-scrollbar overflow-visible p-4 pt-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                    <Timeline issue={selectedIssue} />
                  </CardContent>
                </Card>

                <Card className={cn("workspace-card flex flex-col overflow-hidden rounded-3xl lg:min-h-0", darkMode && "border-slate-800 bg-slate-900/90")}>
                  <CardHeader className="shrink-0 border-b border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>Assignment System</CardTitle>
                        <CardDescription>Dispatch worker, priority, and ETA.</CardDescription>
                      </div>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                        <UserCog className="h-5 w-5" />
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="hide-scrollbar space-y-4 overflow-visible p-4 pt-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                    <div className={cn("rounded-3xl border p-4", selectedIssue ? "border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50" : "border-slate-200 bg-slate-50")}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Selected Issue</p>
                          <p className="mt-2 text-lg font-bold leading-6 text-slate-950">{selectedIssue?.title ?? "Choose an assignment"}</p>
                        </div>
                        <Badge variant={selectedIssue ? statusTone(selectedIssue.status) as "default" : "secondary"} className="shrink-0 rounded-full">
                          {selectedIssue?.status ?? "Waiting"}
                        </Badge>
                      </div>
                      {selectedIssue ? (
                        <div className="mt-4 grid gap-2 text-sm text-slate-700">
                          <p className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2">
                            <ClipboardList className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-slate-950">{issueCode(selectedIssue)}</span>
                          </p>
                          <p className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span>{selectedIssue.location}</span>
                          </p>
                          <p className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2">
                            <ShieldAlert className="h-4 w-4 text-blue-600" />
                            <span>{selectedIssue.severity} priority complaint</span>
                          </p>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm leading-6 text-slate-600">Pick a complaint from Road Assignments first. The dispatch button unlocks after an issue is selected.</p>
                      )}
                    </div>

                    <div className="grid gap-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Department</Label>
                          <Select
                            value={assignmentDraft.department}
                            onValueChange={(value) => setAssignmentDraft((current) => ({ ...current, department: value }))}
                            disabled={selectedIssueReadOnly}
                          >
                            <SelectTrigger className="soft-field h-14 rounded-2xl"><SelectValue /></SelectTrigger>
                            <SelectContent>{departments.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Field Worker</Label>
                          <Select
                            value={assignmentDraft.worker}
                            onValueChange={(value) => setAssignmentDraft((current) => ({ ...current, worker: value }))}
                            disabled={selectedIssueReadOnly}
                          >
                            <SelectTrigger className="soft-field h-14 rounded-2xl"><SelectValue /></SelectTrigger>
                            <SelectContent>{workerNames.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Priority</Label>
                          <Select
                            value={assignmentDraft.priority}
                            onValueChange={(value) => setAssignmentDraft((current) => ({ ...current, priority: value }))}
                            disabled={selectedIssueReadOnly}
                          >
                            <SelectTrigger className="soft-field h-14 rounded-2xl"><SelectValue /></SelectTrigger>
                            <SelectContent>{severities.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">ETA</Label>
                          <div className="relative">
                            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                              type="date"
                              value={assignmentDraft.eta}
                              onChange={(event) => setAssignmentDraft((current) => ({ ...current, eta: event.target.value }))}
                              className="soft-field h-14 rounded-2xl pl-11"
                              disabled={selectedIssueReadOnly}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2 rounded-3xl border border-slate-200 bg-white p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-slate-600">Dispatch readiness</span>
                          <Badge variant={selectedIssueResolved ? "secondary" : selectedIssue ? "success" : "secondary"} className="rounded-full">
                            {selectedIssueResolved ? "Read-only" : selectedIssue ? "Ready" : "Select issue"}
                          </Badge>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {[
                            ["Issue", Boolean(selectedIssue)],
                            ["Worker", Boolean(assignmentDraft.worker)],
                            ["ETA", Boolean(assignmentDraft.eta)]
                          ].map(([label, ready]) => (
                            <span key={String(label)} className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold", ready ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                              <CheckCircle2 className="h-4 w-4" />
                              {String(label)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {selectedAssignment ? (
                      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="font-bold text-emerald-950">Active Assignment</p>
                          <Badge variant="success" className="rounded-full">Tracked</Badge>
                        </div>
                        <div className="grid gap-3 text-emerald-900 sm:grid-cols-2">
                          <p className="rounded-2xl bg-white/70 p-3"><span className="block text-xs font-bold uppercase text-emerald-700">Worker</span>{selectedAssignment.worker}</p>
                          <p className="rounded-2xl bg-white/70 p-3"><span className="block text-xs font-bold uppercase text-emerald-700">Department</span>{selectedAssignment.department}</p>
                          <p className="rounded-2xl bg-white/70 p-3"><span className="block text-xs font-bold uppercase text-emerald-700">Priority</span>{selectedAssignment.priority}</p>
                          <p className="rounded-2xl bg-white/70 p-3"><span className="block text-xs font-bold uppercase text-emerald-700">ETA</span>{selectedAssignment.eta || "Not set"}</p>
                        </div>
                      </div>
                    ) : null}

                    {selectedIssueResolved ? (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                        This resolved assignment is read-only. You can review the record, but worker, priority, and ETA cannot be updated.
                      </div>
                    ) : null}

                    <div className="sticky bottom-0 -mx-4 -mb-4 border-t border-slate-100 bg-white/90 p-4 backdrop-blur-xl">
                      <Button
                        className={cn(
                          "h-14 w-full rounded-2xl text-base shadow-xl",
                          selectedIssueResolved
                            ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-100 shadow-none hover:bg-slate-100 hover:text-slate-400"
                            : "blue-action shadow-blue-600/20"
                        )}
                        onClick={() => void assignSelectedIssue()}
                        disabled={!selectedIssue || selectedIssueReadOnly}
                      >
                        <UserCog className="h-4 w-4" />
                        {selectedIssueResolved ? "Read Only" : selectedAssignment ? "Update Assignment" : "Assign Issue"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </section> : null}

              {showCompletion ? <section className="grid gap-5 overflow-visible lg:h-[calc(100vh-9.5rem)] lg:min-h-0 lg:overflow-hidden xl:grid-cols-[300px_minmax(0,1fr)]">
                <Card className={cn("workspace-card flex flex-col overflow-hidden rounded-3xl lg:min-h-0", darkMode && "border-slate-800 bg-slate-900/90")}>
                  <CardHeader className="shrink-0 border-b p-4">
                    <CardTitle>Road Issue Queue</CardTitle>
                    <CardDescription>Select a customer issue to resolve.</CardDescription>
                  </CardHeader>
                  <CardContent className="hide-scrollbar space-y-3 overflow-visible p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                    {departmentIssues.map((issue) => (
                      <button
                        key={issue.id}
                        type="button"
                        onClick={() => setSelectedIssueId(issue.id)}
                        className={cn(
                          "w-full rounded-2xl border p-3 text-left transition hover:border-blue-300 hover:bg-blue-50",
                          selectedIssue?.id === issue.id ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"
                        )}
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block truncate font-bold text-slate-950">{issue.title}</span>
                            <span className="text-xs font-semibold text-blue-600">{issueCode(issue)}</span>
                          </span>
                          <Badge variant={statusTone(issue.status) as "default"}>{issue.status}</Badge>
                        </span>
                        <span className="mt-2 block text-sm text-slate-500">{issue.location}</span>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card className={cn("workspace-card flex flex-col overflow-hidden rounded-3xl lg:min-h-0", darkMode && "border-slate-800 bg-slate-900/90")}>
                  <CardHeader className="shrink-0 border-b p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Completion Update</p>
                        <CardTitle className="mt-1">Resolve Customer Issue</CardTitle>
                        <CardDescription>Attach proof, record closure details, and publish the resolution to the customer.</CardDescription>
                      </div>
                      <Badge variant="secondary" className="w-fit rounded-full px-3">{officerDepartment}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="hide-scrollbar overflow-visible p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                    <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <p className="font-bold text-slate-950">{selectedIssue?.title ?? "Select an issue"}</p>
                        <p className="mt-1 text-sm text-slate-600">{selectedIssue ? issueCode(selectedIssue) : "--"} - {selectedIssue?.citizen} - {selectedIssue?.location}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current Status</p>
                        <Badge variant={statusTone(selectedIssue?.status ?? "Reported") as "default"} className="mt-2 rounded-full">{selectedIssue?.status ?? "Reported"}</Badge>
                        <p className="mt-2 text-xs text-slate-500">Customer: {selectedIssue?.reporter_phone ?? "Not available"}</p>
                      </div>
                    </div>

                    {selectedIssueResolved ? (
                      <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="font-bold text-slate-950">Read-only resolved record</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          This issue has already been marked resolved. You can view proof, remarks, verification, and closure details, but updates are locked.
                        </p>
                      </div>
                    ) : null}

                    <fieldset disabled={selectedIssueReadOnly} className="contents">
                    <div className="grid gap-4 lg:grid-cols-2">
                      {[
                        { key: "before" as const, label: "Before Repair", image: activeBeforeImage, name: completionMatchesSelected ? completionForm.beforeName : "", helper: "Auto-filled from citizen report or upload original proof" },
                        { key: "after" as const, label: "After Repair", image: activeAfterImage, name: completionMatchesSelected ? completionForm.afterName : "", helper: "Attach authority completion proof" }
                      ].map((item) => (
                        <label
                          key={item.key}
                          className={cn(
                            "group relative flex h-44 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center transition",
                            selectedIssueReadOnly
                              ? "cursor-default"
                              : "cursor-pointer hover:border-blue-400 hover:bg-blue-50"
                          )}
                        >
                          {item.image ? <img src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
                          <span className={cn("relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm", item.image ? "bg-white/90 text-blue-600" : "bg-white text-blue-600 group-hover:bg-blue-600 group-hover:text-white")}>
                            {item.key === "before" ? <FileImage className="h-5 w-5" /> : <ImageUp className="h-5 w-5" />}
                          </span>
                          <span className={cn("relative mt-3 font-bold", item.image ? "rounded-full bg-white/90 px-3 py-1 text-slate-950" : "text-slate-950")}>{item.label}</span>
                          <span className={cn("relative mt-1 max-w-[80%] truncate text-sm", item.image ? "rounded-full bg-slate-950/70 px-3 py-1 text-white" : "text-slate-500")}>
                            {item.name || item.helper}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) => attachCompletionImage(event.target.files?.[0], item.key)}
                            disabled={selectedIssueReadOnly}
                          />
                        </label>
                      ))}
                    </div>

                    <div className={cn(
                      "mt-5 rounded-3xl border p-4",
                      displayedResolutionVerification
                        ? displayedResolutionVerification.resolved
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-amber-200 bg-amber-50"
                        : "border-blue-100 bg-blue-50"
                    )}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                            <ScanSearch className="h-4 w-4" />
                            AI Before / After Verification
                          </p>
                          <h3 className="mt-2 text-lg font-bold text-slate-950">
                            {verifyingResolution
                              ? "Running AI verification..."
                              : displayedResolutionVerification
                              ? displayedResolutionVerification.resolved
                                ? "Repair evidence looks valid"
                                : "Additional work required"
                              : "Upload after image to run verification"}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {displayedResolutionVerification?.remarks ?? "Citizen complaint image is used automatically as the before repair proof."}
                          </p>
                        </div>
                        <div className="shrink-0 rounded-2xl bg-white/80 px-4 py-3 text-center shadow-sm">
                          <p className="text-xs font-bold uppercase text-slate-500">Confidence</p>
                          <p className="text-3xl font-bold text-slate-950">{verifyingResolution ? "..." : displayedResolutionVerification?.confidence ?? "--"}%</p>
                        </div>
                      </div>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                        <div
                          className={cn("h-full rounded-full", (displayedResolutionVerification?.confidence ?? 0) >= 70 ? "bg-emerald-500" : "bg-amber-500")}
                          style={{ width: `${displayedResolutionVerification?.confidence ?? 0}%` }}
                        />
                      </div>
                      {displayedResolutionVerification?.visual_improvements.length ? (
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {displayedResolutionVerification.visual_improvements.map((item) => (
                            <p key={item} className="rounded-2xl bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700">{item}</p>
                          ))}
                        </div>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 h-11 w-full rounded-2xl bg-white/80 sm:w-auto"
                        onClick={() => void runResolutionVerification()}
                        disabled={selectedIssueReadOnly || !proofReady || verifyingResolution}
                      >
                        {verifyingResolution ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                        {selectedIssueResolved ? "Read Only" : verifyingResolution ? "Checking images..." : "Run AI Check"}
                      </Button>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div className="lg:col-span-2">
                        <Label>Resolution Summary</Label>
                        <Textarea
                          value={completionForm.summary}
                          onChange={(event) => setCompletionForm((current) => ({ ...current, summary: event.target.value }))}
                          className="soft-field mt-2 h-24 resize-none"
                          placeholder="Describe the completed road repair, materials used, and final field remarks..."
                          readOnly={selectedIssueReadOnly}
                          disabled={selectedIssueReadOnly}
                        />
                      </div>
                      <div>
                        <Label>Materials / Work Done</Label>
                        <Input
                          value={completionForm.materials}
                          onChange={(event) => setCompletionForm((current) => ({ ...current, materials: event.target.value }))}
                          className="soft-field mt-2 h-12"
                          placeholder="Asphalt patching, leveling"
                          readOnly={selectedIssueReadOnly}
                          disabled={selectedIssueReadOnly}
                        />
                      </div>
                      <div>
                        <Label>Customer Update Note</Label>
                        <Input
                          value={completionForm.publicNote}
                          onChange={(event) => setCompletionForm((current) => ({ ...current, publicNote: event.target.value }))}
                          className="soft-field mt-2 h-12"
                          placeholder="Visible in reported history"
                          readOnly={selectedIssueReadOnly}
                          disabled={selectedIssueReadOnly}
                        />
                      </div>
                      <div>
                        <Label>Completion Date</Label>
                        <Input
                          type="date"
                          value={completionForm.completionDate}
                          onChange={(event) => setCompletionForm((current) => ({ ...current, completionDate: event.target.value }))}
                          className="soft-field mt-2 h-12"
                          readOnly={selectedIssueReadOnly}
                          disabled={selectedIssueReadOnly}
                        />
                      </div>
                      <div>
                        <Label>Field Worker</Label>
                        <Input
                          value={completionForm.fieldWorker}
                          onChange={(event) => setCompletionForm((current) => ({ ...current, fieldWorker: event.target.value }))}
                          className="soft-field mt-2 h-12"
                          placeholder="Field worker name"
                          readOnly={selectedIssueReadOnly}
                          disabled={selectedIssueReadOnly}
                        />
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="mb-3 font-bold text-slate-950">Final Verification</p>
                      <div className="grid gap-3 md:grid-cols-3">
                        {[
                          ["roadSafe", "Road is safe for public use"],
                          ["debrisCleared", "Debris and barricades cleared"],
                          ["citizenVisible", "Publish update to citizen"]
                        ].map(([key, label]) => (
                          <label key={key} className="flex items-center gap-3 rounded-xl border bg-white p-3 text-sm font-semibold text-slate-700">
                            <Checkbox
                              checked={Boolean(completionForm[key as keyof typeof completionForm])}
                              onCheckedChange={(checked) => setCompletionForm((current) => ({ ...current, [key]: checked === true }))}
                              disabled={selectedIssueReadOnly}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className={cn(
                      "mt-4 rounded-2xl border p-3 text-sm",
                      selectedIssueResolved
                        ? "border-slate-200 bg-slate-50"
                        : canSubmitResolution
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-blue-100 bg-blue-50"
                    )}>
                      <p className={cn("font-bold", selectedIssueResolved ? "text-slate-950" : canSubmitResolution ? "text-emerald-950" : "text-blue-950")}>
                        {selectedIssueResolved ? "Resolution record" : "Resolution readiness"}
                      </p>
                      {selectedIssueResolved ? (
                        <p className="mt-1 text-slate-600">Resolved records are locked. Review only mode is active for this complaint.</p>
                      ) : missingResolutionItems.length > 0 ? (
                        <p className="mt-1 text-blue-800">Pending: {missingResolutionItems.join(", ")}.</p>
                      ) : (
                        <p className="mt-1 text-emerald-700">All required proof, remarks, and verification checks are ready.</p>
                      )}
                      {completionError ? <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-semibold text-red-700">{completionError}</p> : null}
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-500">Resolution proof and remarks are saved against the selected customer complaint.</p>
                      <Button
                        className={cn(
                          "h-12 w-full sm:w-[190px]",
                          canSubmitResolution
                            ? "blue-action"
                            : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-100 shadow-none hover:bg-slate-100 hover:text-slate-400"
                        )}
                        onClick={() => void submitResolution()}
                        disabled={selectedIssueReadOnly || !canSubmitResolution}
                      >
                        {resolving || verifyingResolution ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        {selectedIssueResolved ? "Read Only" : verifyingResolution ? "Verifying..." : resolving ? "Resolving..." : canSubmitResolution ? "Mark Resolved" : "Complete Required Fields"}
                      </Button>
                    </div>
                    </fieldset>
                  </CardContent>
                </Card>
              </section> : null}

              {false && showCompletion ? <section className="grid h-[calc(100vh-9.5rem)] min-h-0 gap-5 overflow-hidden xl:grid-cols-[300px_minmax(0,1fr)]">
                <Card className={cn("workspace-card flex min-h-0 flex-col overflow-hidden rounded-3xl", darkMode && "border-slate-800 bg-slate-900/90")}>
                  <CardHeader className="shrink-0 border-b p-4">
                    <CardTitle>Road Issue Queue</CardTitle>
                    <CardDescription>Select a customer issue to close.</CardDescription>
                  </CardHeader>
                  <CardContent className="hide-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
                    {departmentIssues.map((issue) => (
                      <button
                        key={issue.id}
                        type="button"
                        onClick={() => setSelectedIssueId(issue.id)}
                        className={cn(
                          "w-full rounded-2xl border p-3 text-left transition hover:border-blue-300 hover:bg-blue-50",
                          selectedIssue?.id === issue.id ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"
                        )}
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block truncate font-bold text-slate-950">{issue.title}</span>
                            <span className="text-xs font-semibold text-blue-600">{issueCode(issue)}</span>
                          </span>
                          <Badge variant={statusTone(issue.status) as "default"}>{issue.status}</Badge>
                        </span>
                        <span className="mt-2 block text-sm text-slate-500">{issue.location}</span>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card className={cn("workspace-card flex min-h-0 flex-col overflow-hidden rounded-3xl", darkMode && "border-slate-800 bg-slate-900/90")}>
                  <CardHeader className="shrink-0 border-b p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Completion Update</p>
                        <CardTitle className="mt-1">Resolve Customer Issue</CardTitle>
                        <CardDescription>Attach proof, record closure details, and publish the resolution to the customer.</CardDescription>
                      </div>
                      <Badge variant="secondary" className="rounded-full px-3">{officerDepartment}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
                    <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <p className="font-bold text-slate-950">{selectedIssue?.title ?? "Select an issue"}</p>
                      <p className="mt-1 text-sm text-slate-600">{selectedIssue ? issueCode(selectedIssue) : "--"} • {selectedIssue?.citizen} • {selectedIssue?.location}</p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      {["Before Repair", "After Repair"].map((label) => (
                        <button key={label} type="button" className="group flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-blue-400 hover:bg-blue-50">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white">
                            <ImageUp className="h-5 w-5" />
                          </span>
                          <span className="mt-3 font-bold text-slate-950">{label}</span>
                          <span className="mt-1 text-sm text-slate-500">Upload completion proof</span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div className="lg:col-span-2">
                        <Label>Resolution Summary</Label>
                        <Textarea className="soft-field mt-2 h-28 resize-none" placeholder="Describe the completed road repair, materials used, and final field remarks..." />
                      </div>
                      <div>
                        <Label>Completion Date</Label>
                        <Input type="date" className="soft-field mt-2 h-12" />
                      </div>
                      <div>
                        <Label>Field Worker</Label>
                        <Input className="soft-field mt-2 h-12" placeholder="Field worker name" />
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-500">This resolution becomes visible in the citizen's reported history timeline.</p>
                      <Button className="blue-action h-12 w-full sm:w-[190px]" onClick={() => void runAction("resolution")}>
                        <CheckCircle2 className="h-4 w-4" />
                        Mark Resolved
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className={cn("workspace-card flex min-h-0 flex-col overflow-hidden rounded-3xl", darkMode && "border-slate-800 bg-slate-900/90")}>
                  <CardHeader className="shrink-0 p-4">
                    <CardTitle>Citizen Timeline Preview</CardTitle>
                    <CardDescription>What the reporting user will see.</CardDescription>
                  </CardHeader>
                  <CardContent className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pt-0">
                    <Timeline issue={selectedIssue} />
                  </CardContent>
                </Card>
              </section> : null}

              {showReports ? <section className="grid gap-5 overflow-visible lg:h-[calc(100vh-9.5rem)] lg:min-h-0 lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="grid min-w-0 gap-5 overflow-visible lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden">
                  <Card className={cn("workspace-card shrink-0 overflow-hidden rounded-3xl", darkMode && "border-slate-800 bg-slate-900/90")}>
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-cyan-800 p-4 text-white">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Reports Workspace</p>
                            <h2 className="mt-1 text-2xl font-bold">{officerDepartment} Reports</h2>
                            <p className="mt-1 max-w-2xl text-sm text-blue-100">Export registers, SLA summaries, assignments, and resolution proof records.</p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button className="bg-white text-slate-950 hover:bg-blue-50"><Download className="h-4 w-4" /> PDF</Button>
                            <Button className="bg-white text-slate-950 hover:bg-blue-50"><Download className="h-4 w-4" /> Excel</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <section className="grid min-w-0 gap-5 overflow-visible lg:min-h-0 lg:overflow-hidden xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <Card className={cn("workspace-card flex min-w-0 flex-col overflow-hidden rounded-3xl lg:min-h-0", darkMode && "border-slate-800 bg-slate-900/90")}>
                      <CardHeader className="shrink-0 border-b p-4">
                        <CardTitle>Report Library</CardTitle>
                        <CardDescription>Exports ready for review.</CardDescription>
                      </CardHeader>
                      <CardContent className="hide-scrollbar space-y-3 overflow-visible p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                        {[
                          ["Complaint Register", "Citizen, ward, status, severity, and verification count.", "Ready"],
                          ["Worker Assignment Log", "Worker, priority, ETA, and active issue assignment records.", "Live"],
                          ["SLA Exception Report", "Overdue and critical issues grouped by response window.", "Review"],
                          ["Resolution Proof Pack", "Completed issue timeline with completion proof fields.", "Draft"]
                        ].map(([title, detail, state]) => (
                          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-bold text-slate-950">{title}</p>
                                <p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p>
                              </div>
                              <Badge variant={state === "Ready" || state === "Live" ? "success" : "secondary"} className="shrink-0">{state}</Badge>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className={cn("workspace-card flex min-w-0 flex-col overflow-hidden rounded-3xl lg:min-h-0", darkMode && "border-slate-800 bg-slate-900/90")}>
                      <CardHeader className="shrink-0 border-b p-4">
                        <CardTitle>Report Metrics</CardTitle>
                        <CardDescription>Department scope and branch load.</CardDescription>
                      </CardHeader>
                      <CardContent className="hide-scrollbar overflow-visible p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                        <div className="mb-4 grid gap-3 sm:grid-cols-2">
                          {[
                            ["Total", departmentIssues.length],
                            ["In Progress", departmentIssues.filter((issue) => issue.status === "In Progress").length],
                            ["Resolved", departmentIssues.filter((issue) => issue.status === "Resolved").length],
                            ["Critical", departmentIssues.filter((issue) => issue.severity === "Critical").length]
                          ].map(([label, value]) => (
                            <div key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{String(label)}</p>
                              <p className="mt-2 text-3xl font-bold text-slate-950">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                        {dashboard ? <BarChart data={departmentPerformance.length ? departmentPerformance : dashboard.department_performance.slice(0, 1)} /> : null}
                      </CardContent>
                    </Card>
                  </section>
                </div>

                <aside className="grid min-w-0 gap-5 overflow-visible lg:min-h-0 lg:grid-rows-[minmax(0,1fr)_auto] lg:overflow-hidden">
                  <Card className={cn("workspace-card flex flex-col overflow-hidden rounded-3xl lg:min-h-0", darkMode && "border-slate-800 bg-slate-900/90")}>
                    <CardHeader className="shrink-0 border-b p-4">
                      <CardTitle>Operational Events</CardTitle>
                      <CardDescription>Recent report-relevant activity.</CardDescription>
                    </CardHeader>
                    <CardContent className="hide-scrollbar space-y-3 overflow-visible p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                      {dashboard?.notifications.map((item) => (
                        <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
                          <p className="font-bold text-slate-950">{item.title}</p>
                          <p className="mt-1 text-slate-500">{item.detail}</p>
                          <p className="mt-2 text-xs font-semibold text-slate-400">{item.time}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className={cn("workspace-card shrink-0 rounded-3xl", darkMode && "border-slate-800 bg-slate-900/90")}>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle>Export Queue</CardTitle>
                      <CardDescription>Supervisor outputs</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2 p-4 pt-2">
                      <Button variant="outline" className="h-11 justify-start bg-white"><Download className="h-4 w-4" /> Monthly PDF</Button>
                      <Button variant="outline" className="h-11 justify-start bg-white"><Download className="h-4 w-4" /> Assignment Excel</Button>
                      <Button variant="outline" className="h-11 justify-start bg-white"><Download className="h-4 w-4" /> SLA CSV</Button>
                    </CardContent>
                  </Card>
                </aside>
              </section> : null}

              {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
            </main>
          </div>
        </div>
      </AppShell>
    </RequireRole>
  );
}

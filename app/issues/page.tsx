import { DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import {
  Bot,
  Building2,
  CheckCircle2,
  FileImage,
  ImagePlus,
  Loader2,
  LocateFixed,
  Save,
  ShieldAlert,
  ShieldCheck,
  ThumbsUp,
  UploadCloud
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { analyzeIssueImage, createIssue, getNearbyCommunityIssues, verifyIssue } from "@/lib/api";
import type { AiAnalysis, Issue, IssueCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const categories: Array<{ value: IssueCategory; label: string; helper: string }> = [
  { value: "pothole", label: "Pothole", helper: "Road surface damage" },
  { value: "garbage", label: "Garbage", helper: "Waste or dumping" },
  { value: "water_leakage", label: "Water Leakage", helper: "Pipe or supply issue" },
  { value: "streetlight", label: "Streetlight", helper: "Lighting outage" },
  { value: "drainage", label: "Drainage", helper: "Blocked water flow" }
];

const VERIFIED_ISSUES_KEY = "civicconnect_verified_issue_ids";

function categoryLabel(category: IssueCategory) {
  return categories.find((item) => item.value === category)?.label ?? category;
}

function loadVerifiedIssueIds() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }
  const raw = sessionStorage.getItem(VERIFIED_ISSUES_KEY);
  if (!raw) {
    return new Set<string>();
  }
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set<string>();
  }
}

function saveVerifiedIssueIds(ids: Set<string>) {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(VERIFIED_ISSUES_KEY, JSON.stringify([...ids]));
}

export default function IssuesPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const gpsRequestInFlightRef = useRef(false);
  const lastPositionRef = useRef<{ latitude: string; longitude: string } | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [dragging, setDragging] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [lastGpsUpdate, setLastGpsUpdate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyIssue, setBusyIssue] = useState<string | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [verifiedIssueIds, setVerifiedIssueIds] = useState<Set<string>>(() => loadVerifiedIssueIds());
  const [form, setForm] = useState({
    title: "",
    description: "",
    latitude: "",
    longitude: "",
    category: "pothole" as IssueCategory
  });
  const imageRejected = analysis?.is_civic_issue === false;

  useEffect(() => {
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setIssues([]);
      return;
    }

    let active = true;
    setNearbyLoading(true);
    getNearbyCommunityIssues(latitude, longitude, 10)
      .then((items) => {
        if (active) setIssues(items);
      })
      .catch(() => {
        if (active) setIssues([]);
      })
      .finally(() => {
        if (active) setNearbyLoading(false);
      });

    return () => {
      active = false;
    };
  }, [form.latitude, form.longitude]);

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = window.setTimeout(() => setMessage(""), 10000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    mountedRef.current = true;
    requestCurrentLocation({ silent: true });
    const timer = window.setInterval(() => requestCurrentLocation({ silent: true }), 12000);
    return () => {
      mountedRef.current = false;
      window.clearInterval(timer);
    };
  }, []);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function selectImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setError("");
    setImage(file);
    setAnalysis(null);
    setAnalyzing(true);
    try {
      const result = await analyzeIssueImage(file, form.category);
      setAnalysis(result);
      if (result.is_civic_issue === false) {
        setError(result.rejection_reason || "Uploaded image is not valid civic issue evidence.");
        return;
      }
      const matched = categories.find((item) => item.label.toLowerCase() === result.category.toLowerCase());
      setForm((current) => ({
        ...current,
        title: result.title || result.category || current.title,
        description: result.description || current.description,
        category: matched?.value ?? current.category
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gemini image analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void selectImage(event.dataTransfer.files[0]);
  }

  function requestCurrentLocation({ silent }: { silent: boolean }) {
    if (gpsRequestInFlightRef.current) {
      return;
    }
    if (!navigator.geolocation) {
      if (!silent) setError("GPS is not available in this browser.");
      return;
    }
    if (!silent) setError("");
    gpsRequestInFlightRef.current = true;
    if (!silent) setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        gpsRequestInFlightRef.current = false;
        if (!mountedRef.current) return;
        const nextPosition = {
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        };
        const previousPosition = lastPositionRef.current;
        const changed =
          !previousPosition ||
          Math.abs(Number(previousPosition.latitude) - Number(nextPosition.latitude)) > 0.00003 ||
          Math.abs(Number(previousPosition.longitude) - Number(nextPosition.longitude)) > 0.00003;

        if (changed) {
          lastPositionRef.current = nextPosition;
          setForm((current) => ({
            ...current,
            latitude: nextPosition.latitude,
            longitude: nextPosition.longitude
          }));
          setLastGpsUpdate(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }
        if (!silent) setLocating(false);
      },
      () => {
        gpsRequestInFlightRef.current = false;
        if (!mountedRef.current) return;
        if (!silent) setError("Unable to read your current location.");
        if (!silent) setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function useCurrentLocation() {
    requestCurrentLocation({ silent: false });
  }

  function resetDraft() {
    setForm((current) => ({ ...current, title: "", description: "", category: "pothole" }));
    setImage(null);
    setAnalysis(null);
    setMessage("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function replaceIssue(updatedIssue: Issue) {
    setIssues((current) => current.map((issue) => (issue.id === updatedIssue.id ? updatedIssue : issue)));
  }

  function markIssueVerified(issueId: string) {
    setVerifiedIssueIds((current) => {
      const next = new Set(current);
      next.add(issueId);
      saveVerifiedIssueIds(next);
      return next;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError("Enter a valid latitude and longitude.");
      return;
    }
    if (imageRejected) {
      setError(analysis?.rejection_reason || "Upload a real civic issue image before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const issue = await createIssue({ ...form, latitude, longitude, image, ai: imageRejected ? null : analysis });
      resetDraft();
      setMessage("Issue submitted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit issue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerify(issue: Issue, voteType: "upvote" | "verify") {
    if (voteType === "verify" && verifiedIssueIds.has(issue.id)) {
      return;
    }
    setBusyIssue(issue.id);
    setError("");
    try {
      const result = await verifyIssue({ issueId: issue.id, voteType });
      replaceIssue(result.issue);
      if (voteType === "verify") {
        markIssueVerified(issue.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update verification.";
      if (voteType === "verify" && message.toLowerCase().includes("already")) {
        markIssueVerified(issue.id);
        setMessage("You already verified this report.");
      } else {
        setError(message);
      }
    } finally {
      setBusyIssue(null);
    }
  }

  return (
    <RequireRole roles={["citizen", "authority", "admin"]}>
      <AppShell>
        <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-3 overflow-x-hidden lg:h-full lg:min-h-0 lg:overflow-hidden">
          <Card className="workspace-card shrink-0 rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Citizen Reporting</p>
                  <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-950">Report a Civic Issue</h1>
                  <p className="text-sm text-slate-600">Photo, AI, GPS and verification workflow.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                  <Badge variant={image ? "success" : "secondary"} className="h-10 justify-center rounded-2xl px-3">Evidence</Badge>
                  <Badge variant={analysis ? (imageRejected ? "warning" : "success") : "secondary"} className="h-10 justify-center rounded-2xl px-3">AI Review</Badge>
                  <Badge variant={form.latitude && form.longitude ? "success" : "secondary"} className="h-10 justify-center rounded-2xl px-3">Location</Badge>
                  <Button className="blue-action h-10 px-5" onClick={useCurrentLocation} disabled={locating}>
                    {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                    GPS
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid flex-1 gap-4 overflow-visible lg:min-h-0 lg:overflow-hidden lg:grid-cols-12 lg:gap-6">
            <Card className="workspace-card min-w-0 overflow-hidden rounded-2xl border-slate-200 shadow-sm lg:col-span-8 lg:min-h-0">
              <CardContent className="h-full p-4">
                <form id="issue-form" className="flex h-full flex-col gap-3 lg:min-h-0" onSubmit={onSubmit}>
                  <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 pb-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-slate-950">Create New Issue</h2>
                      <p className="text-sm text-slate-500">Complete evidence, AI review, location and details.</p>
                    </div>
                  </div>

                  <div className="grid flex-1 gap-3 lg:min-h-0 xl:grid-cols-[0.92fr_1.08fr]">
                    <div className="space-y-3">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        className={cn(
                          "flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-slate-50 p-3 text-center transition sm:min-h-[155px]",
                          dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400"
                        )}
                      >
                        {preview ? (
                          <div className="w-full">
                            <img src={preview} alt="Selected issue preview" className="h-[92px] w-full rounded-xl object-cover shadow-sm" />
                            <p className="mt-1 truncate text-sm font-bold text-slate-900">{image?.name}</p>
                            <p className="text-xs text-slate-500">Click to replace</p>
                          </div>
                        ) : (
                          <>
                            <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                              <UploadCloud className="h-6 w-6" />
                            </span>
                            <p className="text-base font-bold text-slate-950">Drag & drop image</p>
                            <p className="text-sm text-slate-500">Browse JPG, PNG or WebP</p>
                          </>
                        )}
                        <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => void selectImage(event.target.files?.[0])} />
                      </div>

                      <div className="flex h-[72px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                          {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bot className="h-5 w-5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-950">Gemini AI</p>
                          <p className="truncate text-sm text-slate-500">
                            {analyzing
                              ? "Analyzing uploaded image..."
                              : analysis
                                ? imageRejected
                                  ? `Rejected - ${analysis.rejection_reason ?? "Not civic evidence"}`
                                  : `${analysis.category} - ${analysis.severity} - ${analysis.department}`
                                : image
                                  ? "Gemini analysis unavailable. Check backend error below."
                                  : "No image uploaded."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex min-h-0 flex-col gap-3">
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-950">GPS Coordinates</p>
                            <p className="text-xs text-slate-500">
                              {lastGpsUpdate ? `Live polling every 12 sec - ${lastGpsUpdate}` : "Fetching GPS automatically..."}
                            </p>
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={useCurrentLocation} disabled={locating}>
                            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                            GPS
                          </Button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label htmlFor="latitude">Latitude</Label>
                            <Input id="latitude" className="soft-field bg-white" inputMode="decimal" value={form.latitude} onChange={(event) => updateField("latitude", event.target.value)} required />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="longitude">Longitude</Label>
                            <Input id="longitude" className="soft-field bg-white" inputMode="decimal" value={form.longitude} onChange={(event) => updateField("longitude", event.target.value)} required />
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-3 border-t border-slate-200 pt-3 md:grid-cols-[1fr_220px]">
                        <div className="space-y-1.5">
                          <Label htmlFor="title">Title</Label>
                          <Input id="title" className="soft-field" value={form.title} onChange={(event) => updateField("title", event.target.value)} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="category">Selected Category</Label>
                          <Select value={form.category} onValueChange={(value) => updateField("category", value)}>
                            <SelectTrigger id="category" className="soft-field">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {analysis && !imageRejected ? (
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: "Severity", value: analysis.severity, icon: ShieldAlert },
                            { label: "Department", value: analysis.department, icon: Building2 }
                          ].map((item) => {
                            const Icon = item.icon;
                            return (
                              <div key={item.label} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <Icon className="mb-1 h-4 w-4 text-blue-600" />
                                <p className="text-xs font-bold uppercase text-slate-500">{item.label}</p>
                                <p className="truncate text-sm font-bold text-slate-950">{item.value}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                      {imageRejected ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700">
                          {analysis?.rejection_reason || "This image does not appear to be civic issue evidence. Please upload a clear public issue photo."}
                        </div>
                      ) : null}

                      <div className="space-y-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={form.description}
                          onChange={(event) => updateField("description", event.target.value)}
                          required
                          rows={3}
                          className="soft-field min-h-[88px]"
                        />
                      </div>
                    </div>
                  </div>

                  {(message || error) ? (
                    <div className="space-y-2">
                      {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}
                      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
                    </div>
                  ) : null}

                  <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" className="h-12 sm:h-11" onClick={resetDraft}>
                      <Save className="h-4 w-4" />
                      Save Draft
                    </Button>
                    <Button className="blue-action h-12 w-full sm:h-11 sm:w-[180px]" type="submit" disabled={submitting || imageRejected}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                      Submit Issue
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <aside className="min-w-0 overflow-visible lg:col-span-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
              <Card className="workspace-card overflow-hidden rounded-2xl border-slate-200 shadow-sm lg:h-full lg:min-h-0">
                <CardContent className="flex h-full flex-col p-4 lg:min-h-0">
                  <div className="mb-3 flex shrink-0 items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-950">Nearby Community Issues</h2>
                      <p className="text-sm text-slate-500">Reports within 10 km of your coordinates.</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-3">{issues.length}</Badge>
                  </div>

                  <div className="mb-3 shrink-0 rounded-2xl border border-blue-100 bg-blue-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Community Verification</p>
                    <p className="mt-1 text-sm text-blue-900">
                      {form.latitude && form.longitude
                        ? `Live GPS active. Nearby reports refresh when your position updates${lastGpsUpdate ? ` at ${lastGpsUpdate}` : ""}.`
                        : "Allow GPS access to load nearby reports automatically."}
                    </p>
                  </div>

                  <div className="hide-scrollbar space-y-3 overflow-visible lg:min-h-0 lg:flex-1 lg:overflow-y-scroll lg:overscroll-contain lg:max-h-[calc(100vh-14rem)]">
                    {nearbyLoading ? (
                      <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading nearby community reports...</p>
                    ) : null}
                    {!nearbyLoading && issues.map((issue) => {
                      const verifiedByMe = verifiedIssueIds.has(issue.id);
                      return (
                      <Card
                        key={issue.id}
                        className={cn(
                          "min-h-[180px] rounded-2xl border-slate-200 shadow-none transition hover:border-blue-300 lg:h-[180px]",
                          verifiedByMe && "border-emerald-200 bg-emerald-50/30"
                        )}
                      >
                        <CardContent className="flex h-full flex-col p-3">
                          <div className="flex flex-col gap-3 sm:flex-row">
                            {issue.image_url ? (
                              <img src={issue.image_url} alt="" className="h-36 w-full shrink-0 rounded-xl object-cover sm:h-20 sm:w-24" />
                            ) : (
                              <div className="flex h-36 w-full shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 sm:h-20 sm:w-24">
                                <FileImage className="h-6 w-6" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h3 className="truncate text-sm font-bold text-slate-950">{issue.title}</h3>
                                  <p className="text-xs text-slate-500">{categoryLabel(issue.category)}</p>
                                </div>
                                <Badge variant="dark" className="shrink-0 rounded-lg capitalize">{issue.status.replace("_", " ")}</Badge>
                              </div>
                              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="flex items-center gap-1 text-xs font-bold text-blue-800">
                                    <ShieldCheck className="h-4 w-4" />
                                    {issue.verified_count} verified
                                  </span>
                                  <span className="text-xs font-bold text-slate-800">{issue.trust_score}% trust</span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${issue.trust_score}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
                            <Button type="button" variant="secondary" size="sm" disabled={busyIssue === issue.id} onClick={() => void onVerify(issue, "upvote")}>
                              <ThumbsUp className="h-4 w-4" />
                              Upvote
                            </Button>
                            <Button
                              type="button"
                              className={verifiedByMe ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "blue-action"}
                              size="sm"
                              disabled={busyIssue === issue.id || verifiedByMe}
                              onClick={() => void onVerify(issue, "verify")}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {verifiedByMe ? "Verified" : "Verify"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                    {!nearbyLoading && issues.length === 0 ? (
                      <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                        {form.latitude && form.longitude ? "No community reports found within 10 km." : "Use GPS or enter latitude and longitude to find nearby reports."}
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </AppShell>
    </RequireRole>
  );
}

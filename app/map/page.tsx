import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, Flame, Layers, Navigation, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMapIssues } from "@/lib/api";
import type { IssueCategory, IssueStatus, MapIssue } from "@/lib/types";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: any;
    initCivicMap?: () => void;
  }
}

const mapsKey = window.env?.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const categories: Array<"all" | IssueCategory> = ["all", "pothole", "garbage", "water_leakage", "streetlight", "drainage"];
const statuses: Array<"all" | IssueStatus> = ["all", "pending", "in_review", "resolved"];
const severities = ["all", "critical", "medium", "resolved"] as const;

function markerColor(issue: MapIssue) {
  if (issue.status === "resolved") {
    return "#22c55e";
  }
  if (issue.severity === "high") {
    return "#ef4444";
  }
  return "#f97316";
}

function labelize(value: string) {
  return value.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function clusterIssues(issues: MapIssue[]) {
  const groups = new Map<string, MapIssue[]>();
  issues.forEach((issue) => {
    const key = `${issue.latitude.toFixed(2)}:${issue.longitude.toFixed(2)}`;
    groups.set(key, [...(groups.get(key) ?? []), issue]);
  });
  return Array.from(groups.values());
}

function GoogleMapView({ issues, heatmapEnabled, clusteringEnabled }: { issues: MapIssue[]; heatmapEnabled: boolean; clusteringEnabled: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const overlays = useRef<any[]>([]);
  const heatmap = useRef<any>(null);

  useEffect(() => {
    if (!mapsKey || window.google || document.querySelector("#google-maps-script")) {
      return;
    }
    window.initCivicMap = () => undefined;
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=visualization&callback=initCivicMap`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (window.google && mapRef.current && !mapInstance.current) {
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: issues[0]?.latitude ?? 28.6139, lng: issues[0]?.longitude ?? 77.209 },
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "water", stylers: [{ color: "#d8f3f0" }] },
            { featureType: "road", stylers: [{ color: "#ffffff" }] }
          ]
        });
      }
    }, 200);
    return () => window.clearInterval(interval);
  }, [issues]);

  useEffect(() => {
    if (!window.google || !mapInstance.current) {
      return;
    }
    overlays.current.forEach((overlay) => overlay.setMap(null));
    overlays.current = [];
    if (heatmap.current) {
      heatmap.current.setMap(null);
    }

    const info = new window.google.maps.InfoWindow();
    const groups = clusteringEnabled ? clusterIssues(issues) : issues.map((issue) => [issue]);
    groups.forEach((group) => {
      const primary = group[0];
      const marker = new window.google.maps.Marker({
        map: mapInstance.current,
        position: { lat: primary.latitude, lng: primary.longitude },
        label: group.length > 1 ? { text: String(group.length), color: "#ffffff", fontWeight: "700" } : undefined,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: group.length > 1 ? 18 : 10,
          fillColor: group.length > 1 ? "#0f172a" : markerColor(primary),
          fillOpacity: 0.95,
          strokeColor: "#ffffff",
          strokeWeight: 3
        }
      });
      marker.addListener("click", () => {
        info.setContent(`
          <div style="max-width:220px;font-family:Inter,Arial,sans-serif">
            ${primary.image_url ? `<img src="${primary.image_url}" style="height:90px;width:100%;object-fit:cover;border-radius:8px;margin-bottom:8px" />` : ""}
            <strong>${primary.title}</strong>
            <div>Status: ${labelize(primary.status)}</div>
            <div>Votes: ${primary.votes}</div>
            <div>Distance: ${primary.distance} mi</div>
          </div>
        `);
        info.open(mapInstance.current, marker);
      });
      overlays.current.push(marker);
    });

    if (heatmapEnabled && window.google.maps.visualization) {
      heatmap.current = new window.google.maps.visualization.HeatmapLayer({
        data: issues.map((issue) => ({
          location: new window.google.maps.LatLng(issue.latitude, issue.longitude),
          weight: issue.severity === "high" ? 4 : issue.status === "resolved" ? 1 : 2
        })),
        radius: 42
      });
      heatmap.current.setMap(mapInstance.current);
    }
  }, [issues, heatmapEnabled, clusteringEnabled]);

  return <div ref={mapRef} className="h-full min-h-0 w-full rounded-2xl bg-slate-200" />;
}

function FallbackMap({ issues, heatmapEnabled, clusteringEnabled }: { issues: MapIssue[]; heatmapEnabled: boolean; clusteringEnabled: boolean }) {
  const groups = clusteringEnabled ? clusterIssues(issues) : issues.map((issue) => [issue]);
  return (
    <div className="relative h-full min-h-0 overflow-hidden rounded-2xl border border-white/20 bg-slate-950">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute left-1/4 top-0 h-full w-8 rotate-12 bg-teal-400/20 blur-sm" />
        <div className="absolute left-2/3 top-0 h-full w-10 -rotate-12 bg-indigo-400/20 blur-sm" />
      </div>
      {heatmapEnabled ? (
        <>
          <div className="absolute left-[18%] top-[32%] h-48 w-48 rounded-full bg-red-500/30 blur-3xl" />
          <div className="absolute left-[54%] top-[22%] h-56 w-56 rounded-full bg-orange-400/25 blur-3xl" />
          <div className="absolute left-[38%] top-[56%] h-44 w-44 rounded-full bg-green-400/20 blur-3xl" />
        </>
      ) : null}
      {groups.map((group, index) => {
        const issue = group[0];
        const left = 16 + ((index * 23) % 68);
        const top = 18 + ((index * 31) % 62);
        return (
          <div
            key={issue.id}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border-4 border-white text-xs font-bold text-white shadow-2xl"
              style={{ backgroundColor: group.length > 1 ? "#0f172a" : markerColor(issue) }}
            >
              {group.length > 1 ? group.length : ""}
            </div>
            <div className="pointer-events-none absolute left-1/2 top-11 z-20 hidden w-64 -translate-x-1/2 rounded-lg border bg-white p-3 text-slate-950 shadow-2xl group-hover:block">
              {issue.image_url ? <img src={issue.image_url} alt="" className="mb-3 h-24 w-full rounded-md object-cover" /> : null}
              <p className="font-semibold">{issue.title}</p>
              <p className="mt-1 text-sm text-slate-500">Status: {labelize(issue.status)}</p>
              <p className="text-sm text-slate-500">Votes: {issue.votes}</p>
              <p className="text-sm text-slate-500">Distance: {issue.distance} mi</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MapPage() {
  const [issues, setIssues] = useState<MapIssue[]>([]);
  const [category, setCategory] = useState<"all" | IssueCategory>("all");
  const [status, setStatus] = useState<"all" | IssueStatus>("all");
  const [severity, setSeverity] = useState<(typeof severities)[number]>("all");
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [clusteringEnabled, setClusteringEnabled] = useState(true);

  useEffect(() => {
    getMapIssues().then(setIssues).catch(() => setIssues([]));
  }, []);

  const filtered = useMemo(
    () =>
      issues.filter((issue) => {
        const severityBucket = issue.status === "resolved" ? "resolved" : issue.severity === "high" ? "critical" : "medium";
        return (
          (category === "all" || issue.category === category) &&
          (status === "all" || issue.status === status) &&
          (severity === "all" || severityBucket === severity)
        );
      }),
    [category, issues, severity, status]
  );

  return (
    <RequireRole roles={["citizen", "authority", "admin"]}>
      <AppShell>
        <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-3 overflow-x-hidden lg:h-full lg:min-h-0 lg:overflow-hidden">
          <Card className="workspace-card shrink-0 rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Civic field operations</p>
                  <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-950">Issue Map</h1>
                  <p className="text-sm text-slate-600">Live issue markers, heatmap, clustering, filters, and dispatch queue.</p>
                </div>
                <div className="grid shrink-0 grid-cols-3 gap-2 sm:w-[420px]">
                  {[
                    { label: "Critical", value: filtered.filter((issue) => issue.severity === "high").length, color: "bg-red-500" },
                    { label: "Medium", value: filtered.filter((issue) => issue.severity !== "high" && issue.status !== "resolved").length, color: "bg-orange-500" },
                    { label: "Resolved", value: filtered.filter((issue) => issue.status === "resolved").length, color: "bg-emerald-500" }
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2.5 w-2.5 rounded-full", item.color)} />
                        <p className="truncate text-xs font-semibold text-slate-500">{item.label}</p>
                      </div>
                      <p className="mt-1 text-xl font-bold text-slate-950">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="workspace-card shrink-0 rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-3">
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto_auto_auto]">
                <Select value={category} onValueChange={(value) => setCategory(value as typeof category)}>
                  <SelectTrigger className="soft-field h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{labelize(item)}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                  <SelectTrigger className="soft-field h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{statuses.map((item) => <SelectItem key={item} value={item}>{labelize(item)}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={severity} onValueChange={(value) => setSeverity(value as typeof severity)}>
                  <SelectTrigger className="soft-field h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{severities.map((item) => <SelectItem key={item} value={item}>{labelize(item)}</SelectItem>)}</SelectContent>
                </Select>
                <Button type="button" className="h-10" variant={heatmapEnabled ? "default" : "outline"} onClick={() => setHeatmapEnabled((value) => !value)}>
                  <Flame className="h-4 w-4" />
                  Heatmap
                </Button>
                <Button type="button" className="h-10" variant={clusteringEnabled ? "default" : "outline"} onClick={() => setClusteringEnabled((value) => !value)}>
                  <Layers className="h-4 w-4" />
                  Cluster
                </Button>
                <Button className="blue-action h-10 px-4">
                  <Navigation className="h-4 w-4" />
                  Dispatch
                </Button>
              </div>
            </CardContent>
          </Card>

          <section className="grid flex-1 gap-4 overflow-visible lg:min-h-0 lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-6">
            <Card className="workspace-card flex min-h-[430px] min-w-0 flex-col overflow-hidden rounded-2xl border-slate-200 shadow-sm lg:min-h-0">
              <CardHeader className="shrink-0 flex-row items-center justify-between space-y-0 border-b p-4">
                <div>
                  <CardTitle>Live Map</CardTitle>
                  <CardDescription>{filtered.length} visible issue markers</CardDescription>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Badge className="bg-red-50 text-red-700">Critical</Badge>
                  <Badge className="bg-orange-50 text-orange-700">Medium</Badge>
                  <Badge className="bg-emerald-50 text-emerald-700">Resolved</Badge>
                </div>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 p-3">
                <div className="h-full min-h-0 overflow-hidden rounded-2xl">
                  {mapsKey ? (
                    <GoogleMapView issues={filtered} heatmapEnabled={heatmapEnabled} clusteringEnabled={clusteringEnabled} />
                  ) : (
                    <FallbackMap issues={filtered} heatmapEnabled={heatmapEnabled} clusteringEnabled={clusteringEnabled} />
                  )}
                </div>
              </CardContent>
            </Card>

            <aside className="flex min-w-0 flex-col gap-3 overflow-visible lg:min-h-0 lg:overflow-hidden">
              <Card className="workspace-card shrink-0 rounded-2xl border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Filter className="h-4 w-4 text-blue-600" />
                    <p className="font-bold text-slate-950">Marker Legend</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 xl:grid-cols-1">
                    {[
                      ["Critical", "bg-red-500"],
                      ["Medium", "bg-orange-500"],
                      ["Resolved", "bg-green-500"]
                    ].map(([label, color]) => (
                      <div key={label} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-sm font-semibold text-slate-700">
                        <span className={cn("h-3 w-3 shrink-0 rounded-full", color)} />
                        {label}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="workspace-card flex flex-col overflow-hidden rounded-2xl border-slate-200 shadow-sm lg:min-h-0 lg:flex-1">
                <CardHeader className="shrink-0 border-b p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <CardTitle>Issue Queue</CardTitle>
                    </div>
                    <Badge variant="secondary" className="rounded-full">{filtered.length}</Badge>
                  </div>
                  <CardDescription>Visible issues sorted for review</CardDescription>
                </CardHeader>
                <CardContent className="hide-scrollbar overflow-visible p-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
                  <div className="space-y-3">
                    {filtered.map((issue) => (
                      <div key={issue.id} className="rounded-2xl border bg-white p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <p className="line-clamp-2 text-sm font-bold text-slate-950">{issue.title}</p>
                          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: markerColor(issue) }} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{labelize(issue.category)} | {issue.distance} mi | {issue.votes} votes</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="secondary">{labelize(issue.status)}</Badge>
                          <Badge variant={issue.status === "resolved" ? "success" : issue.severity === "high" ? "warning" : "default"}>
                            Trust {issue.trust_score}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {filtered.length === 0 ? <p className="rounded-2xl border bg-white p-4 text-sm text-slate-500">No issues match the current filters.</p> : null}
                  </div>
                </CardContent>
              </Card>
            </aside>
          </section>
        </div>
      </AppShell>
    </RequireRole>
  );
}

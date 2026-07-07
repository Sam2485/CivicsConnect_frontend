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

const categories: Array<"all" | IssueCategory> = ["all", "pothole", "garbage", "water_leakage", "streetlight", "drainage"];
const statuses: Array<"all" | IssueStatus> = ["all", "pending", "in_review", "resolved"];
const severities = ["all", "critical", "medium", "resolved"] as const;
const MAP_RADIUS_KM = 15;

type UserLocation = {
  latitude: number;
  longitude: number;
};

function getMapsKey() {
  return window.env?.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
}

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

function projectedPosition(issue: MapIssue, issues: MapIssue[]) {
  const latitudes = issues.map((item) => item.latitude);
  const longitudes = issues.map((item) => item.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latRange = Math.max(0.0001, maxLat - minLat);
  const lngRange = Math.max(0.0001, maxLng - minLng);
  return {
    left: 12 + ((issue.longitude - minLng) / lngRange) * 76,
    top: 88 - ((issue.latitude - minLat) / latRange) * 76
  };
}

function GoogleMapView({
  issues,
  heatmapEnabled,
  clusteringEnabled,
  mapsKey,
  userLocation,
  radiusKm
}: {
  issues: MapIssue[];
  heatmapEnabled: boolean;
  clusteringEnabled: boolean;
  mapsKey: string;
  userLocation: UserLocation | null;
  radiusKm: number;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const overlays = useRef<any[]>([]);
  const heatmap = useRef<any>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(Boolean(window.google));

  function clearMapLayers() {
    overlays.current.forEach((overlay) => {
      if (overlay && typeof overlay.setMap === "function") {
        overlay.setMap(null);
      }
    });
    overlays.current = [];
    if (heatmap.current && typeof heatmap.current.setMap === "function") {
      heatmap.current.setMap(null);
    }
    heatmap.current = null;
  }

  useEffect(() => {
    if (!mapsKey) {
      return;
    }
    if (window.google) {
      setMapsLoaded(true);
      return;
    }
    const existingScript = document.querySelector<HTMLScriptElement>("#google-maps-script");
    const handleMapLoaded = () => setMapsLoaded(true);
    const handleMapError = () => setLoadFailed(true);
    window.initCivicMap = handleMapLoaded;
    if (existingScript) {
      existingScript.addEventListener("load", handleMapLoaded);
      existingScript.addEventListener("error", handleMapError);
      return () => {
        existingScript.removeEventListener("load", handleMapLoaded);
        existingScript.removeEventListener("error", handleMapError);
      };
    }
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=visualization&callback=initCivicMap`;
    script.async = true;
    script.onload = handleMapLoaded;
    script.onerror = handleMapError;
    document.head.appendChild(script);
  }, [mapsKey]);

  useEffect(() => {
    if (!mapsLoaded || !window.google || !mapRef.current || mapInstance.current) {
      return;
    }
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: userLocation?.latitude ?? issues[0]?.latitude ?? 28.6139, lng: userLocation?.longitude ?? issues[0]?.longitude ?? 77.209 },
      zoom: userLocation ? 11 : 12,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "water", stylers: [{ color: "#d8f3f0" }] },
        { featureType: "road", stylers: [{ color: "#ffffff" }] }
      ]
    });
  }, [issues, mapsLoaded, userLocation]);

  useEffect(() => {
    if (!window.google || !mapInstance.current) {
      return;
    }
    clearMapLayers();

    const info = new window.google.maps.InfoWindow();
    const groups = clusteringEnabled ? clusterIssues(issues) : issues.map((issue) => [issue]);
    try {
      if (userLocation) {
        const userPosition = { lat: userLocation.latitude, lng: userLocation.longitude };
        mapInstance.current.setCenter(userPosition);
        mapInstance.current.setZoom(11);
        const userMarker = new window.google.maps.Marker({
          map: mapInstance.current,
          position: userPosition,
          title: "Your location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#2563eb",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3
          }
        });
        const radiusCircle = new window.google.maps.Circle({
          map: mapInstance.current,
          center: userPosition,
          radius: radiusKm * 1000,
          strokeColor: "#2563eb",
          strokeOpacity: 0.7,
          strokeWeight: 2,
          fillColor: "#2563eb",
          fillOpacity: 0.08
        });
        overlays.current.push(userMarker, radiusCircle);
      }
      groups.forEach((group) => {
        const primary = group[0];
        if (!Number.isFinite(primary.latitude) || !Number.isFinite(primary.longitude)) {
          return;
        }
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
              <div>Distance: ${primary.distance} km</div>
            </div>
          `);
          info.open(mapInstance.current, marker);
        });
        overlays.current.push(marker);
      });

      if (heatmapEnabled && window.google.maps.visualization?.HeatmapLayer) {
        heatmap.current = new window.google.maps.visualization.HeatmapLayer({
          data: issues
            .filter((issue) => Number.isFinite(issue.latitude) && Number.isFinite(issue.longitude))
            .map((issue) => ({
              location: new window.google.maps.LatLng(issue.latitude, issue.longitude),
              weight: issue.severity === "high" ? 4 : issue.status === "resolved" ? 1 : 2
            })),
          radius: 42
        });
        heatmap.current.setMap(mapInstance.current);
      }
    } catch (error) {
      console.error("Unable to update map overlays", error);
      clearMapLayers();
    }

    return clearMapLayers;
  }, [issues, heatmapEnabled, clusteringEnabled, userLocation, radiusKm]);

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden rounded-2xl bg-slate-200">
      <div ref={mapRef} className="h-full min-h-0 w-full" />
      {loadFailed ? (
        <div className="absolute inset-x-4 top-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm">
          Google Maps failed to load. Check `VITE_GOOGLE_MAPS_API_KEY`, API restrictions, billing, and Maps JavaScript API status.
        </div>
      ) : !mapsLoaded ? (
        <div className="absolute left-4 top-4 rounded-2xl bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
          Loading Google Map...
        </div>
      ) : null}
    </div>
  );
}

function FallbackMap({
  issues,
  heatmapEnabled,
  clusteringEnabled,
  mapsKey,
  userLocation,
  radiusKm
}: {
  issues: MapIssue[];
  heatmapEnabled: boolean;
  clusteringEnabled: boolean;
  mapsKey: string;
  userLocation: UserLocation | null;
  radiusKm: number;
}) {
  const groups = clusteringEnabled ? clusterIssues(issues) : issues.map((issue) => [issue]);
  return (
    <div className="relative h-full min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-[#eef5ef]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute left-[-8%] top-[48%] h-7 w-[120%] rotate-6 rounded-full bg-white shadow-sm" />
        <div className="absolute left-[14%] top-[-10%] h-[130%] w-8 -rotate-12 rounded-full bg-white shadow-sm" />
        <div className="absolute left-[68%] top-[-10%] h-[130%] w-10 rotate-12 rounded-full bg-white shadow-sm" />
        <div className="absolute left-0 top-[22%] h-5 w-full -rotate-3 rounded-full bg-slate-100" />
        <div className="absolute left-0 top-[70%] h-5 w-full rotate-2 rounded-full bg-slate-100" />
      </div>
      {heatmapEnabled ? (
        <>
          <div className="absolute left-[18%] top-[32%] h-44 w-44 rounded-full bg-red-500/20 blur-3xl" />
          <div className="absolute left-[54%] top-[22%] h-52 w-52 rounded-full bg-orange-400/20 blur-3xl" />
          <div className="absolute left-[38%] top-[56%] h-40 w-40 rounded-full bg-green-400/20 blur-3xl" />
        </>
      ) : null}
      {!mapsKey ? (
        <div className="absolute left-4 top-4 z-10 max-w-sm rounded-2xl border border-blue-100 bg-white/95 px-4 py-3 text-sm text-slate-700 shadow-sm">
          <p className="font-bold text-slate-950">Fallback map</p>
          <p className="mt-1">Add `VITE_GOOGLE_MAPS_API_KEY` to show real Google Maps tiles.</p>
        </div>
      ) : null}
      {userLocation ? (
        <div className="absolute left-1/2 top-1/2 h-[56%] w-[56%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-500/70 bg-blue-500/10 shadow-[0_0_0_999px_rgba(15,23,42,0.08)]" />
      ) : null}
      {userLocation ? (
        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1">
          <span className="h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-lg" />
          <span className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-bold text-blue-700 shadow">{radiusKm} km</span>
        </div>
      ) : null}
      {groups.map((group, index) => {
        const issue = group[0];
        const position = projectedPosition(issue, issues.length ? issues : [issue]);
        return (
          <div
            key={issue.id}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${position.left}%`, top: `${position.top}%` }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white text-xs font-bold text-white shadow-xl ring-2 ring-slate-950/10"
              style={{ backgroundColor: group.length > 1 ? "#0f172a" : markerColor(issue) }}
            >
              {group.length > 1 ? group.length : ""}
            </div>
            <div className="pointer-events-none absolute left-1/2 top-11 z-20 hidden w-64 -translate-x-1/2 rounded-lg border bg-white p-3 text-slate-950 shadow-2xl group-hover:block">
              {issue.image_url ? <img src={issue.image_url} alt="" className="mb-3 h-24 w-full rounded-md object-cover" /> : null}
              <p className="font-semibold">{issue.title}</p>
              <p className="mt-1 text-sm text-slate-500">Status: {labelize(issue.status)}</p>
              <p className="text-sm text-slate-500">Votes: {issue.votes}</p>
              <p className="text-sm text-slate-500">Distance: {issue.distance} km</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MapPage() {
  const mapsKey = getMapsKey();
  const [issues, setIssues] = useState<MapIssue[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState("Fetching your GPS location...");
  const [category, setCategory] = useState<"all" | IssueCategory>("all");
  const [status, setStatus] = useState<"all" | IssueStatus>("all");
  const [severity, setSeverity] = useState<(typeof severities)[number]>("all");
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const [dispatchMessage, setDispatchMessage] = useState("");

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("GPS is not available in this browser. Enable location to show nearby issues.");
      setIssues([]);
      return;
    }

    let active = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!active) return;
        const nextLocation = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6))
        };
        setUserLocation(nextLocation);
        setLocationStatus(`Showing reports within ${MAP_RADIUS_KM} km of your current location.`);
        getMapIssues({ ...nextLocation, radiusKm: MAP_RADIUS_KM })
          .then((items) => {
            if (active) setIssues(items);
          })
          .catch(() => {
            if (active) {
              setIssues([]);
              setLocationStatus("Unable to load reports near your current location.");
            }
          });
      },
      () => {
        if (!active) return;
        setIssues([]);
        setLocationStatus("Location permission is required to show reports within 15 km of you.");
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
    );

    return () => {
      active = false;
    };
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

  function dispatchVisibleIssues() {
    setDispatchMessage(filtered.length ? `${filtered.length} visible issue${filtered.length === 1 ? "" : "s"} queued for dispatch review.` : "No visible issues to dispatch.");
    window.setTimeout(() => setDispatchMessage(""), 4000);
  }

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
                  <p className="text-sm text-slate-600">{locationStatus}</p>
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
                <Button type="button" className="blue-action h-10 px-4" onClick={dispatchVisibleIssues}>
                  <Navigation className="h-4 w-4" />
                  Dispatch
                </Button>
              </div>
              {dispatchMessage ? <p className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">{dispatchMessage}</p> : null}
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
                    <GoogleMapView
                      issues={filtered}
                      heatmapEnabled={heatmapEnabled}
                      clusteringEnabled={clusteringEnabled}
                      mapsKey={mapsKey}
                      userLocation={userLocation}
                      radiusKm={MAP_RADIUS_KM}
                    />
                  ) : (
                    <FallbackMap
                      issues={filtered}
                      heatmapEnabled={heatmapEnabled}
                      clusteringEnabled={clusteringEnabled}
                      mapsKey={mapsKey}
                      userLocation={userLocation}
                      radiusKm={MAP_RADIUS_KM}
                    />
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
                        <p className="mt-1 text-xs text-muted-foreground">{labelize(issue.category)} | {issue.distance} km | {issue.votes} votes</p>
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

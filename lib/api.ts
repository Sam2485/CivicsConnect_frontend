import type {
  AiAnalysis,
  AiResolutionVerification,
  AuthResponse,
  AuthorityDashboardData,
  AuthorityIssue,
  AuthorityProfile,
  DashboardData,
  Issue,
  IssueCategory,
  IssueDetail,
  IssueSeverity,
  MapIssue,
  User
} from "@/lib/types";

const API_URL = window.env?.VITE_API_URL || import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const AUTH_DISABLED = (window.env?.VITE_AUTH_DISABLED || import.meta.env.VITE_AUTH_DISABLED || import.meta.env.NEXT_PUBLIC_AUTH_DISABLED) === "true";
const MOCK_USER_KEY = "civicconnect_mock_user";
const MOCK_ISSUES_KEY = "civicconnect_mock_issues";
const AUTH_TOKEN_KEY = "civicconnect_access_token";
const AUTHORITY_SERVICE_RADIUS_KM = 20;
const URL_FIELDS = new Set(["image_url", "evidence_url"]);

const authorityProfiles: AuthorityProfile[] = [
  {
    id: "road-central",
    name: "Central Road Works Authority",
    email: "authority@civicconnect.ai",
    department: "Road Department",
    zone: "Central Civic Zone",
    latitude: 28.6139,
    longitude: 77.209,
    radius_km: AUTHORITY_SERVICE_RADIUS_KM
  },
  {
    id: "road-west",
    name: "West Road Works Authority",
    email: "roadwest@civicconnect.ai",
    department: "Road Department",
    zone: "West Civic Zone",
    latitude: 28.6517,
    longitude: 77.1242,
    radius_km: AUTHORITY_SERVICE_RADIUS_KM
  },
  {
    id: "sanitation-central",
    name: "Central Sanitation Authority",
    email: "sanitation@civicconnect.ai",
    department: "Sanitation Department",
    zone: "Central Civic Zone",
    latitude: 28.62,
    longitude: 77.21,
    radius_km: AUTHORITY_SERVICE_RADIUS_KM
  },
  {
    id: "water-central",
    name: "Central Water Authority",
    email: "water@civicconnect.ai",
    department: "Water Department",
    zone: "Central Civic Zone",
    latitude: 28.603,
    longitude: 77.23,
    radius_km: AUTHORITY_SERVICE_RADIUS_KM
  },
  {
    id: "electrical-central",
    name: "Central Electrical Authority",
    email: "electrical@civicconnect.ai",
    department: "Electrical Department",
    zone: "Central Civic Zone",
    latitude: 28.615,
    longitude: 77.22,
    radius_km: AUTHORITY_SERVICE_RADIUS_KM
  },
  {
    id: "drainage-east",
    name: "East Drainage Authority",
    email: "drainage@civicconnect.ai",
    department: "Drainage Department",
    zone: "East Civic Zone",
    latitude: 28.627,
    longitude: 77.28,
    radius_km: AUTHORITY_SERVICE_RADIUS_KM
  }
];

const demoAccounts = [
  {
    email: "citizen@civicconnect.ai",
    password: "citizen123",
    user: {
      id: "demo-citizen-user",
      name: "Normal User",
      email: "citizen@civicconnect.ai",
      phone_number: "+91 90000 00001",
      role: "citizen" as User["role"],
      created_at: new Date().toISOString()
    }
  },
  {
    email: "authority@civicconnect.ai",
    password: "authority123",
    user: {
      id: "demo-authority-user",
      name: "Authority Officer",
      email: "authority@civicconnect.ai",
      phone_number: "+91 90000 00002",
      role: "authority" as User["role"],
      created_at: new Date().toISOString()
    }
  },
  {
    email: "sanitation@civicconnect.ai",
    password: "authority123",
    user: {
      id: "demo-sanitation-authority",
      name: "Sanitation Officer",
      email: "sanitation@civicconnect.ai",
      phone_number: "+91 90000 00003",
      role: "authority" as User["role"],
      created_at: new Date().toISOString()
    }
  },
  {
    email: "water@civicconnect.ai",
    password: "authority123",
    user: {
      id: "demo-water-authority",
      name: "Water Officer",
      email: "water@civicconnect.ai",
      phone_number: "+91 90000 00004",
      role: "authority" as User["role"],
      created_at: new Date().toISOString()
    }
  }
];

const mockDashboard: DashboardData = {
  total_issues: 248,
  resolved_issues: 186,
  pending_issues: 42,
  nearby_issues: 20,
  community_score: 82,
  recent_issues: [
    {
      id: "CC-1048",
      title: "Streetlight outage near Civic Plaza",
      category: "Infrastructure",
      status: "Pending",
      location: "Ward 7",
      reported_at: "Today, 09:20"
    },
    {
      id: "CC-1042",
      title: "Overflowing waste bins by Market Road",
      category: "Cleanliness",
      status: "In Review",
      location: "Ward 3",
      reported_at: "Yesterday, 16:45"
    },
    {
      id: "CC-1036",
      title: "Pothole repaired on Riverside Avenue",
      category: "Infrastructure",
      status: "Resolved",
      location: "Ward 5",
      reported_at: "Jun 24, 11:10"
    }
  ],
  ai_insights: [
    {
      title: "Maintenance demand is clustering",
      summary: "Infrastructure reports are concentrated around Ward 7 and should be batched for faster field routing.",
      confidence: 91
    },
    {
      title: "Cleanliness response is improving",
      summary: "Waste-related reports are being resolved 18% faster than last week after route adjustments.",
      confidence: 87
    }
  ],
  community_health: {
    infrastructure: 82,
    cleanliness: 78,
    response: 85
  },
  line_chart: [
    { label: "Mon", issues: 28 },
    { label: "Tue", issues: 34 },
    { label: "Wed", issues: 26 },
    { label: "Thu", issues: 41 },
    { label: "Fri", issues: 38 },
    { label: "Sat", issues: 31 },
    { label: "Sun", issues: 24 }
  ],
  pie_chart: [
    { label: "Resolved", value: 186, color: "#14b8a6" },
    { label: "Pending", value: 42, color: "#f59e0b" },
    { label: "Nearby", value: 20, color: "#6366f1" }
  ]
};

const mockAuthorityIssues: AuthorityIssue[] = [
  "Major pothole near Civic Plaza",
  "Water leakage at Market Road",
  "Streetlight outage in Sector 8",
  "Garbage overflow beside bus depot",
  "Drainage blockage after rainfall",
  "Broken footpath near school zone",
  "Open manhole at Ring Road",
  "Traffic signal failure near hospital"
].map((title, index) => {
  const categories = ["Pothole", "Water Leakage", "Streetlight", "Garbage", "Drainage"];
  const departments = ["Road Department", "Water Department", "Electrical Department", "Sanitation Department", "Drainage Department"];
  const statuses = ["Reported", "Assigned", "In Progress", "Resolved"];
  const severities = ["Critical", "High", "Medium", "Low"];
  return {
    id: `CC-${1280 + index}`,
    display_id: `C${1280 + index}`,
    title,
    category: categories[index % categories.length],
    severity: severities[index % severities.length],
    citizen: ["Ayush Sharma", "Neha Rao", "Ravi Kumar", "Meera Shah"][index % 4],
    department: departments[index % departments.length],
    status: statuses[index % statuses.length],
    created_date: `${20 + index} Jun 2026`,
    created_time: `${9 + index}:20 AM`,
    location: `Ward ${index + 2}, Civic Zone`,
    votes: 12 + index * 4,
    verification_count: 8 + index * 2,
    distance: Number((0.6 + index * 0.7).toFixed(1)),
    image_url: null,
    reporter_phone: "+91 98765 43210",
    description: "Citizen-submitted civic issue requiring department review, assignment, and field resolution proof."
  };
});

const mockAuthorityDashboard: AuthorityDashboardData = {
  kpis: {
    total_issues: { count: 1245, change: 12.4 },
    open_issues: { count: 182, change: -4.2 },
    in_progress: { count: 153, change: 8.1 },
    resolved_issues: { count: 876, change: 16.8 },
    critical: { count: 34, change: -2.6 }
  },
  resolution_rate: [
    { month: "Jan", resolved: 70, pending: 30 },
    { month: "Feb", resolved: 75, pending: 25 },
    { month: "Mar", resolved: 80, pending: 20 },
    { month: "Apr", resolved: 83, pending: 17 },
    { month: "May", resolved: 88, pending: 12 }
  ],
  department_performance: [
    { department: "Road Department", total: 342, resolved: 256, avg_response: "18h" },
    { department: "Water Department", total: 214, resolved: 176, avg_response: "14h" },
    { department: "Electrical Department", total: 188, resolved: 151, avg_response: "11h" },
    { department: "Sanitation Department", total: 286, resolved: 231, avg_response: "9h" }
  ],
  notifications: [
    { title: "New complaint assigned", detail: "Road Department received CC-1280", time: "2 min ago" },
    { title: "Status updated", detail: "Streetlight outage moved to In Progress", time: "18 min ago" },
    { title: "Resolution overdue", detail: "Drainage issue exceeded SLA", time: "1 hr ago" }
  ]
};

function createMockJwt(role: string) {
  const header = { alg: "none", typ: "JWT" };
  const payload = {
    sub: "00000000-0000-4000-8000-000000000001",
    role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
  };
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${encode(header)}.${encode(payload)}.dev`;
}

function setMockSession(user: User) {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  sessionStorage.setItem(AUTH_TOKEN_KEY, createMockJwt(user.role));
}

function getMockSession() {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = sessionStorage.getItem(MOCK_USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

function clearMockSession() {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(MOCK_USER_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

function distanceKm(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function activeAuthorityProfile() {
  const user = getMockSession();
  return authorityProfiles.find((profile) => profile.email === user?.email) ?? authorityProfiles[0];
}

export function getAuthorityProfile() {
  return activeAuthorityProfile();
}

export function fetchAuthorityProfile() {
  if (AUTH_DISABLED) {
    return Promise.resolve(activeAuthorityProfile());
  }
  return request<AuthorityProfile>("/authority/profile");
}

export function updateAuthorityProfileLocation(payload: {
  latitude: number;
  longitude: number;
  radius_km?: number;
  zone?: string;
  department?: string;
}) {
  if (AUTH_DISABLED) {
    const profile = activeAuthorityProfile();
    Object.assign(profile, payload);
    return Promise.resolve(profile);
  }
  return request<AuthorityProfile>("/authority/profile", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

function routeIssueToAuthority(issue: Issue) {
  const department = departmentForIssue(issue);
  const issueLocation = { latitude: issue.latitude, longitude: issue.longitude };
  const sameDepartmentProfiles = authorityProfiles.filter((profile) => profile.department === department);
  const candidateProfiles = sameDepartmentProfiles.length ? sameDepartmentProfiles : authorityProfiles;
  const ranked = candidateProfiles
    .map((profile) => ({ profile, distance: distanceKm(issueLocation, profile) }))
    .sort((a, b) => a.distance - b.distance);
  const inServiceArea = ranked.find((item) => item.distance <= item.profile.radius_km);
  const assignment = inServiceArea ?? ranked[0];
  return {
    profile: assignment.profile,
    department,
    distance: Number(assignment.distance.toFixed(1)),
    fallback: !inServiceArea
  };
}

function withAuthorityRouting(issue: Issue): Issue {
  if (issue.assigned_authority_id && issue.assigned_department) {
    return issue;
  }
  const route = routeIssueToAuthority(issue);
  return {
    ...issue,
    assigned_authority_id: route.profile.id,
    assigned_authority_name: route.profile.name,
    assigned_department: route.department,
    authority_distance_km: route.distance,
    routed_by_fallback: route.fallback
  };
}

function inferSeverity(category: IssueCategory): IssueSeverity {
  if (category === "water_leakage" || category === "drainage") {
    return "high";
  }
  if (category === "pothole" || category === "streetlight") {
    return "medium";
  }
  return "low";
}

function demoAnalysis(category: IssueCategory): AiAnalysis {
  const results = {
    pothole: {
      title: "Road pothole needs repair",
      category: "Pothole",
      severity: "High",
      department: "Road Department",
      description: "Large road damage detected.",
      is_civic_issue: true,
      rejection_reason: null
    },
    garbage: {
      title: "Garbage accumulation needs cleanup",
      category: "Garbage",
      severity: "Medium",
      department: "Sanitation Department",
      description: "Garbage accumulation detected in a public area.",
      is_civic_issue: true,
      rejection_reason: null
    },
    water_leakage: {
      title: "Water leakage needs urgent repair",
      category: "Water Leakage",
      severity: "High",
      department: "Water Department",
      description: "Water leakage detected and may require urgent repair.",
      is_civic_issue: true,
      rejection_reason: null
    },
    streetlight: {
      title: "Streetlight requires maintenance",
      category: "Streetlight",
      severity: "Medium",
      department: "Electrical Department",
      description: "Streetlight issue detected near a public route.",
      is_civic_issue: true,
      rejection_reason: null
    },
    drainage: {
      title: "Drainage blockage needs clearing",
      category: "Drainage",
      severity: "High",
      department: "Drainage Department",
      description: "Drainage blockage or overflow detected.",
      is_civic_issue: true,
      rejection_reason: null
    }
  };
  return results[category];
}

function getMockIssues() {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = localStorage.getItem(MOCK_ISSUES_KEY);
  if (raw) {
    const parsed = JSON.parse(raw) as Issue[];
    const routed = parsed.map(withAuthorityRouting);
    if (JSON.stringify(parsed) !== JSON.stringify(routed)) {
      localStorage.setItem(MOCK_ISSUES_KEY, JSON.stringify(routed));
    }
    return routed;
  }
  const seeded: Issue[] = [
    {
      id: "CC-1049",
      title: "Major pothole near Civic Plaza",
      description: "Road surface is broken near the main crossing and vehicles are swerving around it.",
      image_url: null,
      latitude: 28.6129,
      longitude: 77.2088,
      status: "pending",
      severity: "high",
      category: "pothole",
      ai_category: "Pothole",
      ai_severity: "High",
      ai_department: "Road Department",
      ai_description: "Large road damage detected near a public route.",
      votes: 31,
      verified_count: 14,
      trust_score: 91,
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "CC-1048",
      title: "Streetlight outage near Civic Plaza",
      description: "The light has been out for two nights and the walkway is difficult to use after sunset.",
      image_url: null,
      latitude: 28.6139,
      longitude: 77.209,
      status: "pending",
      severity: "medium",
      category: "streetlight",
      ai_category: "Streetlight",
      ai_severity: "Medium",
      ai_department: "Electrical Department",
      ai_description: "Streetlight outage detected near a public walkway.",
      votes: 24,
      verified_count: 18,
      trust_score: 92,
      created_at: new Date().toISOString()
    },
    {
      id: "CC-1042",
      title: "Garbage collection missed on Market Road",
      description: "Bins are overflowing near the bus stop and need pickup.",
      image_url: null,
      latitude: 28.62,
      longitude: 77.21,
      status: "in_review",
      severity: "low",
      category: "garbage",
      ai_category: "Garbage",
      ai_severity: "Low",
      ai_department: "Sanitation Department",
      ai_description: "Overflowing waste bins detected near a public stop.",
      votes: 13,
      verified_count: 9,
      trust_score: 84,
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];
  const routedSeeded = seeded.map(withAuthorityRouting);
  localStorage.setItem(MOCK_ISSUES_KEY, JSON.stringify(routedSeeded));
  return routedSeeded;
}

function saveMockIssues(issues: Issue[]) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(MOCK_ISSUES_KEY, JSON.stringify(issues));
}

function departmentForIssue(issue: Issue) {
  if (issue.ai_department) {
    return issue.ai_department;
  }
  const departments: Record<IssueCategory, string> = {
    pothole: "Road Department",
    garbage: "Sanitation Department",
    water_leakage: "Water Department",
    streetlight: "Electrical Department",
    drainage: "Drainage Department"
  };
  return departments[issue.category];
}

function buildMockTimeline(issue: Issue) {
  const createdAt = new Date(issue.created_at);
  const department = departmentForIssue(issue);
  const completedUntil = issue.status === "resolved" ? 5 : issue.status === "in_review" ? 4 : issue.verified_count > 0 ? 2 : 1;
  const resolutionRemark = [
    issue.resolution_public_note || issue.resolution_summary || "Issue resolved and marked closed.",
    issue.resolution_worker ? `Completed by ${issue.resolution_worker}.` : ""
  ].filter(Boolean).join(" ");
  const stages = [
    { stage: "Reported", offsetDays: 0, remarks: "Citizen report received with location and evidence." },
    { stage: "Verified", offsetDays: 1, remarks: `Verified by ${issue.verified_count} community users.` },
    { stage: "Assigned", offsetDays: 2, remarks: `Assigned to ${department} for field inspection.` },
    { stage: "In Progress", offsetDays: 3, remarks: "Field team review is in progress." },
    { stage: "Resolved", offsetDays: 5, remarks: resolutionRemark }
  ];

  return stages.map((item, index) => {
    const timestamp = item.stage === "Resolved" && issue.resolution_date ? new Date(issue.resolution_date) : new Date(createdAt);
    if (!(item.stage === "Resolved" && issue.resolution_date)) {
      timestamp.setDate(createdAt.getDate() + item.offsetDays);
    }
    timestamp.setHours(createdAt.getHours() + index * 2);
    return {
      stage: item.stage,
      date: timestamp.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      time: timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      department,
      remarks: item.remarks,
      completed: index < completedUntil
    };
  });
}

function compactStatus(status: Issue["status"]) {
  return status.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function mockDashboardFromIssues(): DashboardData {
  const issues = getMockIssues();
  const total = issues.length;
  const resolved = issues.filter((issue) => issue.status === "resolved").length;
  const pending = issues.filter((issue) => issue.status !== "resolved").length;
  const verified = issues.filter((issue) => issue.verified_count > 0).length;
  const score = total ? Math.round((resolved / total) * 55 + (verified / total) * 25 + 20) : 0;
  const categoryCounts = issues.reduce<Record<IssueCategory, number>>(
    (counts, issue) => ({ ...counts, [issue.category]: counts[issue.category] + 1 }),
    { pothole: 0, garbage: 0, water_leakage: 0, streetlight: 0, drainage: 0 }
  );
  const infrastructureTotal = categoryCounts.pothole + categoryCounts.streetlight + categoryCounts.drainage;
  const infrastructureResolved = issues.filter((issue) => ["pothole", "streetlight", "drainage"].includes(issue.category) && issue.status === "resolved").length;
  const cleanlinessResolved = issues.filter((issue) => issue.category === "garbage" && issue.status === "resolved").length;
  const topCategory = (Object.keys(categoryCounts) as IssueCategory[]).sort((a, b) => categoryCounts[b] - categoryCounts[a])[0];
  const today = new Date();
  const line_chart = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));
    return {
      label: day.toLocaleDateString("en-IN", { weekday: "short" }),
      issues: issues.filter((issue) => new Date(issue.created_at).toDateString() === day.toDateString()).length
    };
  });

  return {
    total_issues: total,
    resolved_issues: resolved,
    pending_issues: pending,
    nearby_issues: issues.filter((issue) => issue.status === "pending").length,
    community_score: score,
    recent_issues: issues.slice(0, 5).map((issue) => ({
      id: compactIssueId(issue.id),
      title: issue.title,
      category: titleCase(issue.category),
      status: compactStatus(issue.status),
      location: `${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}`,
      reported_at: new Date(issue.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    })),
    ai_insights: total
      ? [
          {
            title: `${titleCase(topCategory)} has the most reports`,
            summary: `${categoryCounts[topCategory]} of ${total} reports are in this category.`,
            confidence: Math.min(95, 55 + Math.round((categoryCounts[topCategory] / total) * 40))
          },
          {
            title: "Resolution coverage",
            summary: `${resolved} of ${total} reports are closed. ${pending} still need action.`,
            confidence: Math.max(45, score)
          }
        ]
      : [],
    community_health: {
      infrastructure: infrastructureTotal ? Math.round((infrastructureResolved / infrastructureTotal) * 100) : 0,
      cleanliness: categoryCounts.garbage ? Math.round((cleanlinessResolved / categoryCounts.garbage) * 100) : 0,
      response: total ? Math.round((resolved / total) * 100) : 0
    },
    line_chart,
    pie_chart: [
      { label: "Resolved", value: resolved, color: "#14b8a6" },
      { label: "Pending", value: pending, color: "#f59e0b" },
      { label: "Reported", value: total, color: "#2563eb" }
    ]
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
}

function resolveApiAssetUrl(value: string) {
  if (!value.startsWith("/")) {
    return value;
  }
  return `${API_URL}${value}`;
}

function normalizeApiPayload<T>(payload: T): T {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeApiPayload(item)) as T;
  }
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      URL_FIELDS.has(key) && typeof value === "string" ? resolveApiAssetUrl(value) : normalizeApiPayload(value)
    ])
  ) as T;
}

function apiErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const detail = "detail" in payload ? (payload as { detail?: unknown }).detail : undefined;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (!item || typeof item !== "object") {
          return String(item);
        }
        const itemRecord = item as { loc?: unknown[]; msg?: unknown };
        const field = Array.isArray(itemRecord.loc) ? itemRecord.loc[itemRecord.loc.length - 1] : null;
        const message = typeof itemRecord.msg === "string" ? itemRecord.msg : "Invalid value";
        return field ? `${String(field)}: ${message}` : message;
      })
      .join(" ");
  }

  return fallback;
}

function compactIssueId(id: string) {
  const digits = id.replace(/\D/g, "").slice(-4);
  if (digits.length === 4) {
    return `C${digits}`;
  }

  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) % 9000;
  }
  return `C${1000 + hash}`;
}

function getSessionToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

function setSessionToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearSessionToken() {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

function authHeaders(headers: HeadersInit | undefined, includeJson: boolean) {
  const nextHeaders = new Headers(headers);
  if (includeJson && !nextHeaders.has("Content-Type")) {
    nextHeaders.set("Content-Type", "application/json");
  }

  const token = getSessionToken();
  if (token) {
    nextHeaders.set("Authorization", `Bearer ${token}`);
  }
  return nextHeaders;
}

type RequestOptions = RequestInit & {
  parseJson?: boolean;
  timeoutMs?: number;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);
  const { timeoutMs: _timeoutMs, parseJson: _parseJson, ...fetchOptions } = options;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      credentials: "include",
      signal: options.signal ?? controller.signal,
      headers: authHeaders(options.headers, true)
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: `Request failed with ${response.status}` }));
    throw new Error(apiErrorMessage(payload, "Request failed"));
  }

  if (options.parseJson === false || response.status === 204) {
    return undefined as T;
  }

  return normalizeApiPayload((await response.json()) as T);
}

async function uploadRequest<T>(path: string, body: FormData): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(undefined, false),
    body
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(apiErrorMessage(payload, "Request failed"));
  }

  return normalizeApiPayload((await response.json()) as T);
}

export function register(payload: {
  name: string;
  email: string;
  phone_number: string;
  password: string;
  confirm_password: string;
  role: string;
  department?: string;
  zone?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
}) {
  if (AUTH_DISABLED) {
    const user: User = {
      id: "00000000-0000-4000-8000-000000000001",
      name: payload.name,
      email: payload.email,
      phone_number: payload.phone_number,
      role: payload.role as User["role"],
      created_at: new Date().toISOString()
    };
    setMockSession(user);
    return Promise.resolve({ user, access_token: getSessionToken() ?? createMockJwt(user.role), token_type: "bearer" as const });
  }

  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  }).then((response) => {
    setSessionToken(response.access_token);
    return response;
  });
}

export function login(payload: { email: string; password: string; remember_me: boolean }) {
  if (AUTH_DISABLED) {
    const account = demoAccounts.find((item) => item.email === payload.email.toLowerCase() && item.password === payload.password);
    if (!account) {
      return Promise.reject(new Error("Use citizen@civicconnect.ai / citizen123 or authority@civicconnect.ai / authority123"));
    }
    const user = account.user;
    setMockSession(user);
    return Promise.resolve({ user, access_token: getSessionToken() ?? createMockJwt(user.role), token_type: "bearer" as const });
  }

  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  }).then((response) => {
    setSessionToken(response.access_token);
    return response;
  });
}

export function checkForgotPasswordUser(payload: { username: string }) {
  if (AUTH_DISABLED) {
    const account = demoAccounts.find(
      (item) =>
        item.email === payload.username.toLowerCase() ||
        item.user.name.toLowerCase() === payload.username.toLowerCase() ||
        item.user.phone_number === payload.username
    );
    if (!account) {
      return Promise.reject(new Error("No account found for this username"));
    }
    return Promise.resolve({ message: "Account found. Enter a new password.", user_id: account.user.id, name: account.user.name });
  }

  return request<{ message: string; user_id: string; name: string }>("/auth/forgot-password/check", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function forgotPassword(payload: { username: string; password: string; confirm_password: string }) {
  if (AUTH_DISABLED) {
    return Promise.resolve({ message: "Demo mode reset simulated. Use seeded demo passwords after reload." });
  }

  return request<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function logout() {
  if (AUTH_DISABLED) {
    clearMockSession();
    return Promise.resolve();
  }

  return request<void>("/auth/logout", { method: "POST", parseJson: false }).finally(clearSessionToken);
}

export function getMe() {
  if (AUTH_DISABLED) {
    const user = getMockSession();
    return user ? Promise.resolve(user) : Promise.reject(new Error("No demo session"));
  }

  return request<User>("/auth/me", { timeoutMs: 3500 });
}

export function getDashboard() {
  if (AUTH_DISABLED) {
    return Promise.resolve(mockDashboardFromIssues());
  }

  return request<DashboardData>("/dashboard");
}

export async function createIssue(payload: {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  category: IssueCategory;
  image?: File | null;
  ai?: AiAnalysis | null;
}) {
  if (AUTH_DISABLED) {
    const issues = getMockIssues();
    const user = getMockSession();
    const issue: Issue = withAuthorityRouting({
      id: `CC-${Math.floor(1000 + Math.random() * 9000)}`,
      title: payload.title,
      description: payload.description,
      image_url: payload.image ? await readFileAsDataUrl(payload.image) : null,
      latitude: payload.latitude,
      longitude: payload.longitude,
      status: "pending",
      severity: payload.ai?.severity.toLowerCase() === "high" ? "high" : inferSeverity(payload.category),
      category: payload.category,
      ai_category: payload.ai?.category ?? null,
      ai_severity: payload.ai?.severity ?? null,
      ai_department: payload.ai?.department ?? null,
      ai_description: payload.ai?.description ?? null,
      votes: Math.floor(8 + Math.random() * 40),
      verified_count: 0,
      trust_score: 72,
      reporter_id: user?.id ?? null,
      created_at: new Date().toISOString()
    });
    saveMockIssues([issue, ...issues]);
    return issue;
  }

  const form = new FormData();
  form.append("title", payload.title);
  form.append("description", payload.description);
  form.append("latitude", String(payload.latitude));
  form.append("longitude", String(payload.longitude));
  form.append("category", payload.category);
  if (payload.ai) {
    form.append("ai_category", payload.ai.category);
    form.append("ai_severity", payload.ai.severity);
    form.append("ai_department", payload.ai.department);
    form.append("ai_description", payload.ai.description);
  }
  if (payload.image) {
    form.append("image", payload.image);
  }
  return uploadRequest<Issue>("/issues", form);
}

export function getIssues() {
  if (AUTH_DISABLED) {
    return Promise.resolve(getMockIssues());
  }

  return request<Issue[]>("/issues");
}

export function getNearbyCommunityIssues(latitude: number, longitude: number, radiusKm = 10) {
  if (AUTH_DISABLED) {
    const user = getMockSession();
    return Promise.resolve(
      getMockIssues()
        .filter((issue) => issue.reporter_id !== user?.id)
        .filter((issue) => distanceKm({ latitude, longitude }, issue) <= radiusKm)
    );
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radius_km: String(radiusKm)
  });
  return request<Issue[]>(`/issues/nearby?${params.toString()}`);
}

export function getIssue(issueId: string) {
  if (AUTH_DISABLED) {
    const issue = getMockIssues().find((item) => item.id === issueId);
    if (!issue) {
      return Promise.reject(new Error("Issue not found"));
    }
    return Promise.resolve({ ...issue, timeline: buildMockTimeline(issue) } satisfies IssueDetail);
  }

  return request<IssueDetail>(`/issues/${issueId}`);
}

export function deleteIssue(issueId: string) {
  if (AUTH_DISABLED) {
    saveMockIssues(getMockIssues().filter((issue) => issue.id !== issueId));
    return Promise.resolve();
  }

  return request<void>(`/issues/${issueId}`, { method: "DELETE", parseJson: false });
}

export async function analyzeIssueImage(image: File, categoryHint: IssueCategory) {
  if (AUTH_DISABLED) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return demoAnalysis(categoryHint);
  }

  const form = new FormData();
  form.append("image", image);
  form.append("category_hint", categoryHint);
  return uploadRequest<AiAnalysis>("/ai/analyze", form);
}

export async function verifyResolutionImages(beforeImage: string, afterImage: string): Promise<AiResolutionVerification> {
  if (AUTH_DISABLED) {
    const changed = beforeImage.slice(0, 160) !== afterImage.slice(0, 160) || beforeImage.length !== afterImage.length;
    const confidence = changed ? 94 : 42;
    return {
      resolved: confidence >= 70,
      confidence,
      remarks: confidence >= 70
        ? "Before and after evidence show meaningful visual improvement. Ready for citizen confirmation."
        : "The completion image does not show enough improvement. Additional work or clearer proof is required.",
      visual_improvements: [
        "Before/after proof pair received",
        changed ? "Visible change detected between proof images" : "Limited visual difference detected",
        confidence >= 70 ? "Repair can proceed to citizen approval" : "Supervisor review recommended"
      ],
      requires_rework: confidence < 70
    };
  }

  return request<AiResolutionVerification>("/ai/verify-resolution", {
    method: "POST",
    body: JSON.stringify({ before_image: beforeImage, after_image: afterImage }),
    timeoutMs: 45000
  });
}

export function getMapIssues() {
  if (AUTH_DISABLED) {
    return Promise.resolve(
      getMockIssues().map((issue, index): MapIssue => ({
        id: issue.id,
        title: issue.title,
        image_url: issue.image_url,
        latitude: issue.latitude + index * 0.006,
        longitude: issue.longitude - index * 0.004,
        status: issue.status,
        severity: issue.severity,
        category: issue.category,
        votes: issue.votes,
        verified_count: issue.verified_count,
        trust_score: issue.trust_score,
        distance: Number((0.7 + index * 1.2).toFixed(1)),
        created_at: issue.created_at
      }))
    );
  }

  return request<MapIssue[]>("/issues/map");
}

export function getAuthorityDashboard() {
  if (AUTH_DISABLED) {
    const profile = activeAuthorityProfile();
    const assignedIssues = getMockIssues().filter((issue) => issue.assigned_authority_id === profile.id);
    const inProgress = assignedIssues.filter((issue) => issue.status === "in_review").length;
    const resolved = assignedIssues.filter((issue) => issue.status === "resolved").length;
    return Promise.resolve({
      ...mockAuthorityDashboard,
      kpis: {
        total_issues: { count: assignedIssues.length, change: 8.4 },
        open_issues: { count: assignedIssues.filter((issue) => issue.status === "pending").length, change: -3.1 },
        in_progress: { count: inProgress, change: 5.8 },
        resolved_issues: { count: resolved, change: 12.2 },
        critical: { count: assignedIssues.filter((issue) => issue.severity === "high").length, change: -1.5 }
      },
      department_performance: [
        {
          department: profile.department,
          total: Math.max(assignedIssues.length, 1),
          resolved,
          avg_response: assignedIssues.some((issue) => issue.routed_by_fallback) ? "18h" : "11h"
        }
      ],
      notifications: assignedIssues.slice(0, 3).map((issue, index) => ({
        title: index === 0 ? "New routed complaint" : issue.status === "resolved" ? "Resolution recorded" : "Field queue updated",
        detail: `${profile.department} received ${compactIssueId(issue.id)}${issue.routed_by_fallback ? " by nearest-authority fallback" : ""}`,
        time: index === 0 ? "2 min ago" : index === 1 ? "18 min ago" : "1 hr ago"
      }))
    });
  }
  return request<AuthorityDashboardData>("/authority/dashboard");
}

function authorityStatus(issue: Issue) {
  if (issue.status === "resolved") return "Resolved";
  if (issue.status === "in_review") return "In Progress";
  return "Reported";
}

function titleCase(value: string) {
  return value.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function authorityIssueFromIssue(issue: Issue): AuthorityIssue {
  return {
    id: issue.id,
    display_id: compactIssueId(issue.id),
    title: issue.title,
    category: issue.ai_category ?? titleCase(issue.category),
    severity: issue.severity === "high" ? "Critical" : issue.severity === "medium" ? "High" : "Medium",
    citizen: "CivicConnect Reporter",
    department: issue.assigned_department ?? departmentForIssue(issue),
    status: authorityStatus(issue),
    created_date: new Date(issue.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    created_time: new Date(issue.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    location: `${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}`,
    votes: issue.votes,
    verification_count: issue.verified_count,
    distance: issue.authority_distance_km ?? 0,
    image_url: issue.image_url,
    reporter_phone: "+91 98765 43210",
    description: issue.description,
    latitude: issue.latitude,
    longitude: issue.longitude,
    assigned_authority_id: issue.assigned_authority_id,
    assigned_authority_name: issue.assigned_authority_name,
    assigned_department: issue.assigned_department,
    authority_distance_km: issue.authority_distance_km,
    routed_by_fallback: issue.routed_by_fallback
  };
}

export function getAuthorityIssues() {
  if (AUTH_DISABLED) {
    const profile = activeAuthorityProfile();
    const assignedIssues = getMockIssues()
      .filter((issue) => issue.assigned_authority_id === profile.id)
      .map(authorityIssueFromIssue);
    return Promise.resolve(assignedIssues);
  }
  return request<AuthorityIssue[]>("/authority/issues");
}

export function assignAuthorityIssue(issueId: string) {
  if (AUTH_DISABLED) {
    const updated = getMockIssues().map((issue) =>
      issue.id === issueId && issue.status !== "resolved"
        ? {
            ...issue,
            status: "in_review" as const
          }
        : issue
    );
    saveMockIssues(updated);
    return Promise.resolve({ issue_id: issueId, message: "Issue assignment updated successfully" });
  }
  return request<{ issue_id: string; message: string }>(`/issues/${issueId}/assign`, { method: "PUT" });
}

export function updateAuthorityIssueStatus(issueId: string) {
  if (AUTH_DISABLED) {
    const updated = getMockIssues().map((issue) =>
      issue.id === issueId
        ? {
            ...issue,
            status: issue.status === "resolved" ? ("resolved" as const) : ("in_review" as const),
            verified_count: Math.max(issue.verified_count, 1),
            trust_score: Math.max(issue.trust_score, 86)
          }
        : issue
    );
    saveMockIssues(updated);
    return Promise.resolve({ issue_id: issueId, message: "Issue status updated successfully" });
  }
  return request<{ issue_id: string; message: string }>(`/issues/${issueId}/status`, { method: "PUT" });
}

export function createIssueResolution(issueId: string, payload: {
  summary: string;
  public_note?: string;
  field_worker: string;
  completion_date: string;
  materials?: string;
  before_image?: string;
  after_image?: string;
  ai_resolved?: boolean;
  ai_confidence?: number;
  ai_remarks?: string;
}) {
  if (AUTH_DISABLED) {
    const updated = getMockIssues().map((issue) =>
      issue.id === issueId
        ? {
            ...issue,
            status: "resolved" as const,
            verified_count: Math.max(issue.verified_count, 1),
            trust_score: 96,
            resolution_summary: payload.summary,
            resolution_public_note: payload.public_note ?? null,
            resolution_worker: payload.field_worker,
            resolution_date: payload.completion_date,
            resolution_materials: payload.materials ?? null,
            resolution_before_image: payload.before_image ?? null,
            resolution_after_image: payload.after_image ?? null,
            ai_resolution_resolved: payload.ai_resolved ?? null,
            ai_resolution_confidence: payload.ai_confidence ?? null,
            ai_resolution_remarks: payload.ai_remarks ?? null
          }
        : issue
    );
    saveMockIssues(updated);
    return Promise.resolve({ issue_id: issueId, message: "Resolution proof uploaded successfully" });
  }
  return request<{ issue_id: string; message: string }>(`/issues/${issueId}/resolution`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function verifyIssue(payload: { issueId: string; voteType: "upvote" | "verify"; evidence?: File | null }) {
  if (AUTH_DISABLED) {
    const issues = getMockIssues();
    const updated = issues.map((issue) => {
      if (issue.id !== payload.issueId) {
        return issue;
      }
      const votes = issue.votes + 1;
      const verified_count = payload.voteType === "verify" ? issue.verified_count + 1 : issue.verified_count;
      return {
        ...issue,
        votes,
        verified_count,
        trust_score: Math.min(99, 72 + verified_count + Math.min(votes, 20))
      };
    });
    saveMockIssues(updated);
    const issue = updated.find((item) => item.id === payload.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }
    return { issue };
  }

  const form = new FormData();
  form.append("issue_id", payload.issueId);
  form.append("vote_type", payload.voteType);
  form.append("user_label", "CivicConnect Demo");
  if (payload.evidence) {
    form.append("evidence", payload.evidence);
  }
  return uploadRequest<{ issue: Issue }>("/verify", form);
}

export async function addComment(payload: { issueId: string; body: string; evidence?: File | null }) {
  if (AUTH_DISABLED) {
    const issues = getMockIssues();
    const updated = issues.map((issue) =>
      issue.id === payload.issueId ? { ...issue, trust_score: Math.min(99, issue.trust_score + 1) } : issue
    );
    saveMockIssues(updated);
    const issue = updated.find((item) => item.id === payload.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }
    return {
      issue,
      comment: {
        id: `CM-${Math.floor(1000 + Math.random() * 9000)}`,
        issue_id: payload.issueId,
        user_label: "CivicConnect Demo",
        body: payload.body,
        evidence_url: null,
        created_at: new Date().toISOString()
      }
    };
  }

  const form = new FormData();
  form.append("issue_id", payload.issueId);
  form.append("body", payload.body);
  form.append("user_label", "CivicConnect Demo");
  if (payload.evidence) {
    form.append("evidence", payload.evidence);
  }
  return uploadRequest<{ issue: Issue }>("/comments", form);
}

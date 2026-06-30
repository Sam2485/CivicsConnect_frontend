export type Role = "citizen" | "authority" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  role: Role;
  created_at: string;
};

export type AuthResponse = {
  user: User;
  access_token: string;
  token_type: "bearer";
};

export type DashboardData = {
  total_issues: number;
  resolved_issues: number;
  pending_issues: number;
  nearby_issues: number;
  community_score: number;
  recent_issues: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    location: string;
    reported_at: string;
  }>;
  ai_insights: Array<{
    title: string;
    summary: string;
    confidence: number;
  }>;
  community_health: {
    infrastructure: number;
    cleanliness: number;
    response: number;
  };
  line_chart: Array<{
    label: string;
    issues: number;
  }>;
  pie_chart: Array<{
    label: string;
    value: number;
    color: string;
  }>;
};

export type IssueCategory = "pothole" | "garbage" | "water_leakage" | "streetlight" | "drainage";
export type IssueStatus = "pending" | "in_review" | "resolved";
export type IssueSeverity = "low" | "medium" | "high";

export type Issue = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  latitude: number;
  longitude: number;
  status: IssueStatus;
  severity: IssueSeverity;
  category: IssueCategory;
  ai_category: string | null;
  ai_severity: string | null;
  ai_department: string | null;
  ai_description: string | null;
  votes: number;
  verified_count: number;
  trust_score: number;
  reporter_id?: string | null;
  resolution_summary?: string | null;
  resolution_public_note?: string | null;
  resolution_worker?: string | null;
  resolution_date?: string | null;
  resolution_materials?: string | null;
  resolution_before_image?: string | null;
  resolution_after_image?: string | null;
  ai_resolution_resolved?: boolean | null;
  ai_resolution_confidence?: number | null;
  ai_resolution_remarks?: string | null;
  created_at: string;
  assigned_authority_id?: string;
  assigned_authority_name?: string;
  assigned_department?: string;
  authority_distance_km?: number;
  routed_by_fallback?: boolean;
};

export type IssueTimelineStep = {
  stage: string;
  date: string;
  time: string;
  department: string;
  remarks: string;
  completed: boolean;
};

export type IssueDetail = Issue & {
  timeline: IssueTimelineStep[];
};

export type CommunityComment = {
  id: string;
  issue_id: string;
  user_label: string;
  body: string;
  evidence_url: string | null;
  created_at: string;
};

export type AiAnalysis = {
  title: string;
  category: string;
  severity: string;
  department: string;
  description: string;
  is_civic_issue?: boolean;
  rejection_reason?: string | null;
};

export type AiResolutionVerification = {
  resolved: boolean;
  confidence: number;
  remarks: string;
  visual_improvements: string[];
  requires_rework: boolean;
};

export type MapIssue = {
  id: string;
  title: string;
  image_url: string | null;
  latitude: number;
  longitude: number;
  status: IssueStatus;
  severity: IssueSeverity;
  category: IssueCategory;
  votes: number;
  verified_count: number;
  trust_score: number;
  distance: number;
  created_at: string;
};

export type AuthorityIssue = {
  id: string;
  display_id?: string;
  title: string;
  category: string;
  severity: string;
  citizen: string;
  department: string;
  status: string;
  created_date: string;
  created_time: string;
  location: string;
  votes: number;
  verification_count: number;
  distance: number;
  image_url: string | null;
  reporter_phone: string;
  description: string;
  resolution_summary?: string | null;
  resolution_public_note?: string | null;
  resolution_worker?: string | null;
  resolution_date?: string | null;
  resolution_materials?: string | null;
  resolution_before_image?: string | null;
  resolution_after_image?: string | null;
  ai_resolution_resolved?: boolean | null;
  ai_resolution_confidence?: number | null;
  ai_resolution_remarks?: string | null;
  latitude?: number;
  longitude?: number;
  assigned_authority_id?: string;
  assigned_authority_name?: string;
  assigned_department?: string;
  authority_distance_km?: number;
  routed_by_fallback?: boolean;
};

export type AuthorityProfile = {
  id: string;
  name: string;
  email?: string;
  user_id?: string;
  department: string;
  zone: string;
  latitude: number;
  longitude: number;
  radius_km: number;
};

export type AuthorityDashboardData = {
  kpis: Record<string, { count: number; change: number }>;
  resolution_rate: Array<{ month: string; resolved: number; pending: number }>;
  department_performance: Array<{ department: string; total: number; resolved: number; avg_response: string }>;
  notifications: Array<{ title: string; detail: string; time: string }>;
};

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
export type Quality = "usable" | "blurry" | "too_dark" | "damage_not_visible";
export type Draft = { subject: string; body: string; speech_text: string };
export type Claim = {
  id: string; product: string; issue: string;
  customer_name: string; brand_model: string; retailer: string; order_number: string;
  purchase_date: string | null; problem_noticed_date: string | null;
  version: number; edited_at: string | null;
  revisions: { version: number; edited_at: string; previous_details: { product: string; issue: string; requested_resolution: string }; previous_draft: Draft | null }[];
  created_at: string; requested_resolution: string; status: "draft" | "ready" | "submitted";
  evidence: { id: string; filename: string; content_type: string; size_bytes: number; quality: Quality | "unassessed" }[];
  camera: { retake_required: boolean; instructions: string[]; speech_text: string };
  corrections: { id: string; message: string; requested_at: string; status: "pending" }[];
  draft: Draft | null;
  submission: { id: string; inbox: string; submitted_at: string; draft: Draft } | null;
};
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); this.name = "ApiError"; }
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(20000) });
  } catch {
    throw new Error("Cannot reach the backend. Check that it is running and allows this website's address.");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const detail = data?.detail;
    throw new ApiError(typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((item: { msg: string }) => item.msg).join("; ") : `Request failed (${response.status}).`, response.status);
  }
  return response.json();
}
export function jsonRequest(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
export function validateEvidence(file: File) {
  if (!["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"].includes(file.type)) throw new Error("Choose a JPEG, PNG, WebP, MP4, or WebM file.");
  if (!file.size || file.size > 10 * 1024 * 1024) throw new Error("Evidence must be nonempty and no larger than 10 MiB.");
}
export function uploadEvidence(id: string, file: File) {
  validateEvidence(file);
  const body = new FormData(); body.append("file", file);
  return api<Claim>(`/claims/${encodeURIComponent(id)}/evidence`, { method: "POST", body });
}

export function statusLabel(claim: Claim): string {
  return claim.status === "submitted" ? "Submitted" : claim.status === "ready" ? "Ready for review" : "Evidence review";
}
export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function claimProgress(claim: Claim) {
  const completed = claim.status === "submitted" ? 3 : claim.draft ? 2 : 1;
  return { completed, percent: Math.round(completed / 3 * 100) };
}
export function shortClaimId(id: string) { return `CLM-${id.slice(0, 8).toUpperCase()}`; }

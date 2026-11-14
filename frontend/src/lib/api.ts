export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
export type Quality = "usable" | "blurry" | "too_dark" | "damage_not_visible";
export type Draft = { subject: string; body: string; speech_text: string };
export type Claim = {
  id: string; product: string; issue: string;
  requested_resolution: string; status: "draft" | "ready" | "submitted";
  evidence: { id: string; filename: string; quality: Quality | "unassessed" }[];
  camera: { retake_required: boolean; instructions: string[]; speech_text: string };
  draft: Draft | null;
  submission: { id: string; inbox: string; submitted_at: string } | null;
};
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, { ...init, cache: "no-store" });
  } catch {
    throw new Error("Cannot reach the backend. Check that it is running and allows this website's address.");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const detail = data?.detail;
    throw new Error(typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((item: { msg: string }) => item.msg).join("; ") : `Request failed (${response.status}).`);
  }
  return response.json();
}
export function jsonRequest(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
const storageKey = `claimly:claims:${API_URL}`;
export function savedClaimIds(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch { return []; }
}
export function rememberClaim(id: string) {
  try { localStorage.setItem(storageKey, JSON.stringify([...new Set([id, ...savedClaimIds()]) ])); } catch { /* Claim remains accessible by its URL. */ }
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

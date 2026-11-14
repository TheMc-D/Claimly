"use client";

import { useEffect, useState } from "react";
import { API_URL, api, jsonRequest, rememberClaim, uploadEvidence, type Claim, type Quality } from "@/lib/api";

const button = "rounded-full bg-blue-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50";
export default function ClaimDetails({ id }: { id: string }) {
  const [claim, setClaim] = useState<Claim | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [draftHint, setDraftHint] = useState("");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    api<Claim>(`/claims/${encodeURIComponent(id)}`).then(value => {
      if (active) { setClaim(value); rememberClaim(value.id); setError(""); }
    }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, reload]);
  async function act(work: () => Promise<Claim>) {
    setBusy(true); setError(""); setDraftHint("");
    try { setClaim(await work()); } catch (error) { setError(error instanceof Error ? error.message : "Request failed."); }
    finally { setBusy(false); }
  }
  const path = `/claims/${encodeURIComponent(id)}`;
  return <div className="mt-8 space-y-6">
    {error && <div role="alert" className="text-red-700">{error} <button className="underline" disabled={busy} onClick={() => setReload(value => value + 1)}>Retry loading</button></div>}
    {loading && <p role="status">Loading claim…</p>}
    {busy && <p role="status">Saving…</p>}
    {claim && <>
      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="text-2xl font-semibold">{claim.product}</h2>
        <p className="mt-3 whitespace-pre-wrap">{claim.issue}</p>
        <p className="mt-3">Requested resolution: {claim.requested_resolution}</p>
        <p>Status: {claim.status}</p>
      </section>
      <section id="evidence-review" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="text-xl font-semibold">Evidence</h2>
        <p>{claim.camera.speech_text}</p>
        <p className="text-sm text-slate-600">After checking your uploaded photo or video, choose Usable in the quality dropdown if the damage is clearly visible. This manual review is required before generating a draft. Changing evidence clears the current draft.</p>
        {claim.evidence.map(item => <div key={item.id} className="space-y-2 border-t border-slate-200 pt-4">
          <a className="text-blue-600 underline" target="_blank" rel="noreferrer" href={`${API_URL}/api${path}/evidence/${encodeURIComponent(item.id)}/content`}>{item.filename}</a>
          <label className="block">Manual quality review
            <select className="ml-3 rounded border border-slate-300 p-2" value={item.quality} disabled={busy || claim.status === "submitted"} onChange={event => {
              const quality = event.target.value as Quality;
              void act(() => api<Claim>(`${path}/evidence/${encodeURIComponent(item.id)}/assessment`, jsonRequest("POST", { quality })));
            }}>
              <option value="unassessed" disabled>Not reviewed</option>
              <option value="usable">Usable</option><option value="blurry">Blurry</option>
              <option value="too_dark">Too dark</option><option value="damage_not_visible">Damage not visible</option>
            </select>
          </label>
        </div>)}
        {claim.status !== "submitted" && <label className="block">Add photo or video (up to 10 MiB)
          <input className="mt-2 block" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" disabled={busy} onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void act(() => uploadEvidence(id, file));
          }} />
        </label>}
      </section>
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="text-xl font-semibold">Review claim draft</h2>
        {claim.status !== "submitted" && <>
          <p className="text-sm text-slate-600">Generate a template draft after marking at least one evidence item usable.</p>
          <button className={button} disabled={busy} aria-describedby={draftHint ? "draft-hint" : undefined} onClick={() => {
            if (claim.camera.retake_required) {
              setDraftHint(claim.evidence.length ? "Review your uploaded evidence above and choose Usable if the damage is clearly visible. Then generate your draft." : "Upload a photo or video of the damage, then review its quality and choose Usable before generating a draft.");
              return;
            }
            void act(() => api<Claim>(`${path}/generate`, { method: "POST" }));
          }}>{claim.draft ? "Regenerate draft" : "Generate draft"}</button>
          {draftHint && <p id="draft-hint" role="status" className="text-amber-800">{draftHint} <a className="underline" href="#evidence-review">Go to evidence review</a></p>}
        </>}
        {claim.draft && <><h3 className="font-semibold">{claim.draft.subject}</h3><p className="whitespace-pre-wrap">{claim.draft.body}</p></>}
        {claim.draft && claim.status !== "submitted" && <>
          <p>Review the draft above before submitting to the demo inbox. No email is sent.</p>
          <button className={button} disabled={busy} onClick={() => void act(async () => {
            const submission = await api<NonNullable<Claim["submission"]>>(`${path}/submit`, { method: "POST" });
            return { ...claim, status: "submitted", submission };
          })}>Submit reviewed claim</button>
        </>}
        {claim.submission && <div role="status"><p>Saved to demo inbox: {claim.submission.inbox}</p><p>Receipt: {claim.submission.id}</p></div>}
      </section>
    </>}
  </div>;
}

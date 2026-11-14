
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, jsonRequest, rememberClaim, uploadEvidence, validateEvidence, type Claim } from "@/lib/api";

export default function ClaimForm() {
  const [product, setProduct] = useState("");
  const [issue, setIssue] = useState("");
  const [resolution, setResolution] = useState("replacement");
  const [evidence, setEvidence] = useState<File | null>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [claimId, setClaimId] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      if (evidence) validateEvidence(evidence);
      let id = claimId;
      if (!id) {
        const claim = await api<Claim>("/claims", jsonRequest("POST", { product, issue, requested_resolution: resolution }));
        id = claim.id; setClaimId(id); rememberClaim(id);
      }
      if (evidence) await uploadEvidence(id, evidence);
      router.push(`/claims/${id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create claim.");
    } finally { setBusy(false); }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 rounded-2xl border border-slate-200 bg-white p-8"
    >
      <h2 className="text-xl font-semibold">
        Product Information
      </h2>

      <fieldset disabled={busy} className="mt-6 space-y-5">
        <div>
          <label htmlFor="product" className="block text-sm font-medium">
            Product Name
          </label>
          <input
            disabled={!!claimId}
            maxLength={200}
            id="product"
            required
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="e.g. Wireless headphones"
            className="mt-2 w-full rounded-lg border border-slate-300 p-3"
          />
        </div>

        <div>
          <label htmlFor="issue" className="block text-sm font-medium">
            Describe the Issue
          </label>
          <textarea
            disabled={!!claimId}
            maxLength={4000}
            id="issue"
            required
            rows={4}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="What went wrong?"
            className="mt-2 w-full rounded-lg border border-slate-300 p-3"
          />
        </div>

        <div>
          <label htmlFor="resolution" className="block text-sm font-medium">
            Preferred Resolution
          </label>
          <select
            disabled={!!claimId}
            id="resolution"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 p-3"
          >
            <option value="replacement">Replacement</option>
            <option value="refund">Refund</option>
            <option value="repair">Repair</option>
          </select>
        </div>

        <div>
          <label htmlFor="evidence" className="block text-sm font-medium">
            Upload Evidence
          </label>
          <input
            id="evidence"
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            onChange={(e) =>
              setEvidence(e.target.files?.[0] ?? null)
            }
            className="mt-2 block w-full text-sm"
          />
          {evidence && (
            <p className="mt-2 text-sm text-slate-500">
              Selected: {evidence.name}
            </p>
          )}
        </div>
      </fieldset>

      <button
        disabled={busy}
        type="submit"
        className="mt-8 rounded-full bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
      >
        {busy ? "Saving…" : claimId ? "Retry Upload / Open Claim" : "Create Claim"}
      </button>

      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      {claimId && <Link className="mt-4 block text-blue-600" href={`/claims/${claimId}`}>Your claim is saved. Open it to continue.</Link>}
    </form>
  );
}

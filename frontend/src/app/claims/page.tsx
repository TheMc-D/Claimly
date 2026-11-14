"use client";


import Link from "next/link";
import ClaimCard from "@/components/ClaimCard";
import { useEffect, useState } from "react";
import { api, savedClaimIds, type Claim } from "@/lib/api";

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.allSettled(savedClaimIds().map(id => api<Claim>(`/claims/${encodeURIComponent(id)}`))).then(results => {
      if (!active) return;
      setClaims(results.flatMap(result => result.status === "fulfilled" ? [result.value] : []));
      if (results.some(result => result.status === "rejected")) setError("Some saved claims could not be loaded. The backend may be unavailable or the records may no longer exist. Refresh to retry.");
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-blue-600">
          ← Back to Home
        </Link>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">
              My Claims
            </h1>

            <p className="mt-2 text-slate-600">
              Claims created in this browser.
            </p>
          </div>

          <Link
            href="/claims/new"
            className="rounded-full bg-blue-600 px-6 py-3 font-semibold text-white"
          >
            + New Claim
          </Link>
        </div>

        <div className="mt-10 space-y-4">
          {loading && <p role="status">Loading claims…</p>}
          {error && <p role="alert" className="text-red-700">{error}</p>}
          {!loading && !claims.length && <p>No claims to display. Start a new claim to get started.</p>}
          {claims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      </div>
    </main>
  );
}

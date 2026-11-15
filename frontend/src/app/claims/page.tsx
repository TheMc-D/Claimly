"use client";

import { useEffect, useState } from "react";
import ClaimCard from "@/components/ClaimCard";
import { Check, Clock, File, Search, Sparkles } from "@/components/Icons";
import { api, type Claim } from "@/lib/api";

type Filter = "All claims" | "In progress" | "Submitted";
export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All claims");
  useEffect(() => {
    let active = true;
    let inFlight = false;
    async function load() {
      if (inFlight) return;
      inFlight = true;
      try {
        const result = await api<Claim[]>("/claims");
        if (active) { setClaims(result); setError(""); }
      } catch (error) {
        if (active) setError(error instanceof Error ? error.message : "Your claims couldn’t be loaded. Please retry.");
      } finally {
        inFlight = false;
        if (active) setLoading(false);
      }
    }
    void load();
    const refresh = () => { if (document.visibilityState === "visible") void load(); };
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [reload]);
  const submitted = claims.filter(claim => claim.status === "submitted").length;
  const visible = claims.filter(claim => (filter === "All claims" || (filter === "Submitted" ? claim.status === "submitted" : claim.status !== "submitted")) && `${claim.id} ${claim.product} ${claim.issue} ${claim.requested_resolution}`.toLowerCase().includes(search.trim().toLowerCase()));
  function clearFilters() { setSearch(""); setFilter("All claims"); }
  return <main className="dashboard-page claims-workspace page-transition">
    <section className="dashboard-heading"><div><span className="eyebrow"><span className="gold-line" />Your claims</span><h1>Your claims, <em>all in one place.</em></h1><p>A clear view of what your agent captured, prepared, and submitted.</p></div><button className="button button--primary" disabled={loading} onClick={() => { setLoading(true); setReload(value => value + 1); }}>{loading ? "Refreshing…" : "Refresh claims"}</button></section>
    <section className="stats-row" aria-label="Claim counts">
      {[{ label: "Total claims", value: claims.length, icon: <File />, note: "Shared demo customer" }, { label: "In progress", value: claims.length - submitted, icon: <Clock />, note: "Preparation and review" }, { label: "Submitted", value: submitted, icon: <Check />, note: "Submission recorded" }].map(stat => <article key={stat.label}><span className="stat-icon">{stat.icon}</span><div><small>{stat.label}</small><strong>{loading ? "—" : stat.value}</strong></div><em>{stat.note}</em></article>)}
    </section>
    <section className="claims-section" aria-labelledby="history-heading"><div className="claims-toolbar"><h2 id="history-heading">Claim history <span>{visible.length}</span></h2><div><label className="search-box"><Search /><input placeholder="Search claims" aria-label="Search claims" value={search} onChange={event => setSearch(event.target.value)} /></label><div className="filter-tabs" aria-label="Filter claims">{(["All claims", "In progress", "Submitted"] as const).map(name => <button type="button" key={name} className={filter === name ? "active" : ""} aria-pressed={filter === name} onClick={() => setFilter(name)}>{name}</button>)}</div></div></div>
      {error && <div role="alert" className="notice notice--error">{error} <button className="inline-link" onClick={() => { setLoading(true); setReload(value => value + 1); }}>Retry</button></div>}
      <div className="claims-list" aria-busy={loading}>{loading ? <div role="status" className="claim-list-loading"><span className="loading-orb" />Loading your claims…</div> : visible.map(claim => <ClaimCard key={claim.id} claim={claim} />)}
        {!loading && !visible.length && <div className="claims-empty"><Search /><strong>{claims.length ? "No matching claims" : error ? "Your claims are temporarily unavailable" : "Your claims will appear here"}</strong><span>{claims.length ? "Try a different search or filter to find your claim." : error ? "Check your connection and retry." : "Your agent handles preparation and submission during the call. Your claim will appear here automatically."}</span>{claims.length ? <button onClick={clearFilters}>Clear filters</button> : <span>Checking automatically for new claims.</span>}</div>}
      </div>
    </section>
    <section className="dashboard-tip"><span><Sparkles /></span><div><strong>Your conversation, clearly documented.</strong><p>Your agent submits during the call. Open a claim to review its evidence and receipt, or edit the details afterward.</p></div></section>
    <p className="dashboard-footnote">Shared demo dashboard · Updates automatically every 5 seconds · Submissions go to a demo inbox.</p>
  </main>;
}

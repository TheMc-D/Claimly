"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, api, claimProgress, formatDate, shortClaimId, statusLabel, type Claim } from "@/lib/api";
import { ArrowRight, Check, Clipboard, Close, Download, File, Package, Sparkles } from "./Icons";
import EvidencePreview, { evidenceUrl } from "./EvidencePreview";

export default function ClaimDetails({ id }: { id: string }) {
  const [claim, setClaim] = useState<Claim | null>(null);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Claim["evidence"][number] | null>(null);

  useEffect(() => {
    let active = true;
    api<Claim>(`/claims/${encodeURIComponent(id)}`).then(value => {
      if (active) { setClaim(value); setError(""); setNotFound(false); }
    }).catch(error => {
      if (active) { setError(error.message); setNotFound(error instanceof ApiError && error.status === 404); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, reload]);

  async function copy(text: string, confirmation: string) {
    try { await navigator.clipboard.writeText(text); setMessage(confirmation); }
    catch { setError("Copy was unavailable. Select the text or address and copy it manually."); }
  }
  function refresh() { setLoading(true); setReload(value => value + 1); }
  function download() {
    if (!claim) return;
    const content = `CLAIMLY — ${claim.id}\nProduct: ${claim.product}\nCreated: ${formatDate(claim.created_at)}\nStatus: ${statusLabel(claim)}\nRequested resolution: ${claim.requested_resolution}\n\n${claim.draft?.subject || "Claim details"}\n\n${claim.draft?.body || claim.issue}\n\nEvidence:\n${claim.evidence.map(item => item.filename).join("\n") || "None attached"}${claim.submission ? `\n\nDemo receipt: ${claim.submission.id}\nSubmitted: ${claim.submission.submitted_at}` : ""}`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `Claimly-${claim.id}.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const complete = claim?.status === "submitted";
  const progress = claim ? claimProgress(claim) : null;
  const photo = claim?.evidence.find(item => item.content_type.startsWith("image/"));
  return <main className="details-page claims-workspace page-transition">
    <Link className="back-link" href="/claims">← <span>Back to my claims</span></Link>
    {message && <p role="status" className="notice">{message}</p>}
    {error && claim && <div role="alert" className="notice notice--error">{error} <button className="inline-link" disabled={loading} onClick={refresh}>Retry</button></div>}
    {!claim && (loading ? <section className="detail-loading" role="status"><span className="loading-orb" /><h1>Opening your claim</h1><p>Gathering the details, evidence, and request.</p></section> : <section className="claim-unavailable" role="alert"><File /><span className="eyebrow">{notFound ? "Claim not found" : "Connection interrupted"}</span><h1>{notFound ? "We couldn’t find this claim." : "Your claim couldn’t be loaded."}</h1><p>{notFound ? "Return to My Claims to see the available claims. This record may have been removed from the demo backend." : error}</p><div className="detail-actions"><Link className="button" href="/claims">View my claims <ArrowRight /></Link><button className="button button--secondary" onClick={refresh}>Try again</button></div></section>)}
    {claim && <>
      <section className="details-heading"><div><span className={`status status--${claim.status}`}><i />{statusLabel(claim)}</span><h1>{claim.product}</h1><p><span title={claim.id}>{shortClaimId(claim.id)}</span><span className="meta-separator">·</span>Created {formatDate(claim.created_at)}</p></div><div className="detail-actions"><Link href={`/claims/${encodeURIComponent(claim.id)}/edit`} className="button button--secondary">Edit claim</Link><button className="button button--secondary" disabled={!claim.draft} onClick={() => void copy(`${claim.draft!.subject}\n\n${claim.draft!.body}`, "Claim text copied.")}>Copy claim <Clipboard /></button><button className="button" onClick={download}>Download claim <Download /></button></div></section>
      <section className="detail-progress-card" aria-label="Claim preparation progress"><div className="progress-summary"><span>Claim progress</span><strong>{progress!.completed} of 3 steps complete</strong></div><div className="milestone-track"><i style={{ width: `${progress!.percent}%` }} /></div><ol className="milestones">{[{ name: "Details captured", done: true, note: formatDate(claim.created_at) }, { name: "Request prepared", done: !!claim.draft, note: claim.draft ? "Ready to read" : "Awaiting draft" }, { name: "Submission recorded", done: complete, note: claim.submission ? formatDate(claim.submission.submitted_at) : "Not yet submitted" }].map((step, index) => <li className={step.done ? "complete" : "pending"} key={step.name}><span>{step.done ? <Check /> : index + 1}</span><strong>{step.name}</strong><small>{step.note}</small></li>)}</ol></section>
      <div className="detail-grid"><div className="detail-main">
        <section className="content-card product-card"><div className="card-title"><div><span className="eyebrow">The product</span><h2>Product information</h2></div><Link href={`/claims/${encodeURIComponent(claim.id)}/edit`} className="inline-link">Edit</Link></div><div className="product-info"><EvidencePreview key={photo?.id || claim.id} claimId={claim.id} evidence={photo} compact /><dl>{[["Customer", claim.customer_name], ["Brand / model", claim.brand_model], ["Retailer", claim.retailer], ["Order number", claim.order_number], ["Purchase date", claim.purchase_date], ["Problem first noticed", claim.problem_noticed_date]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}<div><dt>Product</dt><dd>{claim.product}</dd></div><div><dt>Preferred resolution</dt><dd className="capitalize-value">{claim.requested_resolution}</dd></div><div><dt>Created</dt><dd>{formatDate(claim.created_at)}</dd></div><div><dt>Status</dt><dd>{statusLabel(claim)}</dd></div></dl></div><div className="issue-note"><strong>Issue reported</strong><p className="preserve-lines">{claim.issue}</p></div></section>
        <section id="evidence-review" className="content-card evidence-card"><div className="card-title"><div><span className="eyebrow">Documentation</span><h2>Evidence <span className="section-count">{claim.evidence.length}</span></h2></div><span className="card-note">Captured for this claim</span></div><div className="evidence-gallery">{claim.evidence.map(item => <article className="evidence-tile" key={item.id}><button className="evidence-open" onClick={() => setSelected(item)} aria-label={`View evidence: ${item.filename}`}><EvidencePreview claimId={claim.id} evidence={item} compact /><span className="evidence-open-label">View evidence <ArrowRight /></span></button><div className="evidence-caption"><div><strong title={item.filename}>{item.filename}</strong><small>{item.content_type.startsWith("video/") ? "Video" : "Image"} · {Math.max(1, Math.ceil(item.size_bytes / 1024))} KB</small></div><a href={evidenceUrl(claim.id, item)} target="_blank" rel="noreferrer" aria-label={`Download ${item.filename}`}><Download /></a></div></article>)}</div>{!claim.evidence.length && <div className="evidence-empty"><File /><p>No evidence has been attached yet.</p><span>The evidence collected by your agent will appear here.</span></div>}</section>
        <section className="content-card receipt-card"><div className="card-title"><div><span className="eyebrow">Confirmation</span><h2>{claim.submission ? "Submission receipt" : "Submission status"}</h2></div>{complete ? <Check /> : <File />}</div>{claim.submission ? <><div className="receipt-confirmation"><span><Check /></span><div><strong>Your claim has been recorded</strong><p>{formatDate(claim.submission.submitted_at)} · Demo inbox</p></div></div><dl className="receipt-fields"><div><dt>Receipt ID</dt><dd>{claim.submission.id}</dd></div><div><dt>Destination</dt><dd>{claim.submission.inbox}</dd></div></dl><p className="supporting-copy">Saved in the demo inbox. This receipt does not confirm email delivery or a merchant decision.</p>{claim.edited_at && <details className="original-submission"><summary>View original submitted request</summary><h3>{claim.submission.draft.subject}</h3><p className="preserve-lines">{claim.submission.draft.body}</p></details>}</> : <p className="supporting-copy">No submission has been recorded yet. Once your agent submits the claim, its confirmation will appear here.</p>}</section>
      </div><aside className="summary-card"><div className="summary-badge"><Sparkles /></div><span className="eyebrow">Prepared for your request</span><h2>{claim.edited_at ? "Your updated claim" : complete ? "Your submitted claim" : "Your claim summary"}</h2><div className="summary-status"><span>Request status</span><strong>{statusLabel(claim)}</strong></div><div className="summary-copy">{claim.edited_at && <p className="edited-notice">Edited {formatDate(claim.edited_at)}. This is the current version; the original submission receipt is preserved.</p>}{claim.draft ? <><h3>{claim.draft.subject}</h3><p className="preserve-lines">{claim.draft.body}</p></> : <p>A written request hasn’t been saved yet. Your agent is still preparing this claim. The details and evidence collected so far are shown here.</p>}</div><div className="summary-points"><strong>Included in your claim</strong><span><Check />Product details and reported issue</span><span><File />{claim.evidence.length} evidence file{claim.evidence.length === 1 ? "" : "s"}</span><span><Package /><span className="capitalize-value">{claim.requested_resolution} requested</span></span>{complete && <span><Check />Submission confirmation</span>}</div>{claim.draft && <button className="button" onClick={() => void copy(`${claim.draft!.subject}\n\n${claim.draft!.body}`, "Claim text copied.")}>Copy full claim <Clipboard /></button>}<button className="review-link" onClick={() => void copy(window.location.href, "Claim link copied.")}>Copy link to this claim <ArrowRight /></button><button className="review-link" disabled={loading} onClick={refresh}>{loading ? "Checking for updates…" : "Refresh claim status"}</button><div className="claim-reference"><span>Full claim reference</span><code>{claim.id}</code></div></aside></div>


    </>}
    {selected && <EvidenceDialog claimId={id} evidence={selected} close={() => setSelected(null)} />}
  </main>;
}

function EvidenceDialog({ claimId, evidence, close }: { claimId: string; evidence: Claim["evidence"][number]; close: () => void }) {
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.getElementById("evidence-dialog") as HTMLDialogElement;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus(); };
  }, []);
  return <dialog id="evidence-dialog" className="evidence-dialog" aria-labelledby="evidence-title" onCancel={close} onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="evidence-dialog-heading"><h2 id="evidence-title">{evidence.filename}</h2><button className="evidence-close" onClick={close} aria-label="Close evidence preview" autoFocus><Close /></button></div>
    <EvidencePreview key={evidence.id} claimId={claimId} evidence={evidence} />
    <div className="evidence-dialog-footer"><span>{evidence.content_type} · {Math.max(1, Math.ceil(evidence.size_bytes / 1024))} KB</span><a className="button button--secondary" href={evidenceUrl(claimId, evidence)} target="_blank" rel="noreferrer">Download original <Download /></a></div>
  </dialog>;
}

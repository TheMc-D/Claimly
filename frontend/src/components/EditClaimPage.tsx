"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, jsonRequest, type Claim } from "@/lib/api";
import { ArrowRight, Check, Info, Refund, Replacement, Package } from "./Icons";
import EvidencePreview, { evidenceUrl } from "./EvidencePreview";

type Values = { product: string; customer_name: string; brand_model: string; retailer: string; order_number: string; purchase_date: string; problem_noticed_date: string; issue: string; requested_resolution: string; subject: string; body: string };
export default function EditClaimPage({ id }: { id: string }) {
  const router = useRouter();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [values, setValues] = useState<Values | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const href = `/claims/${encodeURIComponent(id)}`;
  useEffect(() => {
    let active = true;
    api<Claim>(`/claims/${encodeURIComponent(id)}`).then(data => {
      if (!active) return;
      setClaim(data);
      setValues({ product: data.product, customer_name: data.customer_name || "", brand_model: data.brand_model || "", retailer: data.retailer || "", order_number: data.order_number || "", purchase_date: data.purchase_date || "", problem_noticed_date: data.problem_noticed_date || "", issue: data.issue, requested_resolution: data.requested_resolution, subject: data.draft?.subject || "", body: data.draft?.body || "" });
      setError("");
    }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, reload]);
  function change(field: keyof Values, value: string) { setValues(previous => previous ? { ...previous, [field]: value } : null); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!claim || !values || busy) return;
    if (!values.product.trim() || !values.issue.trim() || (claim.draft && (!values.subject.trim() || !values.body.trim()))) { setError("Fill in the product, issue, and written request without leaving them blank."); return; }
    setBusy(true); setError("");
    try {
      const { subject, body, ...details } = values;
      await api<Claim>(`/claims/${encodeURIComponent(id)}`, jsonRequest("PUT", { ...details, purchase_date: values.purchase_date || null, problem_noticed_date: values.problem_noticed_date || null, version: claim.version ?? 0, draft: claim.draft ? { subject, body, speech_text: body === claim.draft.body ? claim.draft.speech_text : body } : null }));
      router.push(href); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save your edits."); setBusy(false); }
  }
  return <main className="workspace claim-start edit-claim-page page-transition">
    <aside className="journey-panel"><div className="eyebrow eyebrow--light"><span className="gold-line" />Your claim journey</div><h1>Let’s make your<br /><em>details right.</em></h1><p>Your call is complete. Review the information captured by your agent and update anything that needs changing.</p><ol className="journey-steps"><li className="complete"><span><Check /></span><div><strong>Conversation complete</strong><small>Your story and product details</small></div></li><li className="complete"><span><Check /></span><div><strong>Claim captured</strong><small>Evidence and written request</small></div></li><li className="current"><span>3</span><div><strong>Review and edit</strong><small>Save your updated details</small></div></li></ol><div className="journey-help"><Info /><div><strong>Your submission is kept on record</strong><span>Saving updates your dashboard. It does not send another request to a merchant.</span></div></div></aside>
    <section className="form-panel"><Link className="inline-link" href={href}>← Back to claim</Link><div className="form-heading"><div><span className="eyebrow">Captured during your call</span><h2>Edit your claim details</h2></div></div>
      {loading && <p role="status">Loading your claim…</p>}
      {error && <div role="alert" className="notice notice--error">{error} <button type="button" className="inline-link" disabled={busy} onClick={() => { if (!values || window.confirm("Reload this claim? Unsaved changes will be discarded.")) { setLoading(true); setReload(value => value + 1); } }}>Reload claim</button></div>}
      {claim && values && <form onSubmit={save}><fieldset disabled={busy || loading}>
        <div className="form-grid">{([{ key: "customer_name", label: "Customer name" }, { key: "product", label: "Product name", required: true }, { key: "brand_model", label: "Brand or model" }, { key: "retailer", label: "Purchased from" }, { key: "order_number", label: "Order number" }, { key: "purchase_date", label: "Purchase date", type: "date" }, { key: "problem_noticed_date", label: "Problem first noticed", type: "date" }] as const).map(field => <label key={field.key}><span>{field.label}{!("required" in field) && <small>Optional</small>}</span><input name={field.key} type={"type" in field ? field.type : "text"} value={values[field.key]} required={"required" in field} maxLength={200} onChange={event => change(field.key, event.target.value)} /></label>)}</div>
        <label className="full-field"><span>What went wrong?</span><textarea name="issue" required maxLength={4000} rows={5} value={values.issue} onChange={event => change("issue", event.target.value)} /><small>Edit the issue captured from your conversation.</small></label>
        <fieldset className="choice-field"><legend>What outcome would you prefer?</legend><div className="choice-row">{[{ value: "refund", label: "Refund", icon: <Refund />, note: "Request your money back" }, { value: "replacement", label: "Replacement", icon: <Replacement />, note: "Receive an undamaged item" }, { value: "repair", label: "Repair", icon: <Package />, note: "Have the product fixed" }].map(option => <button key={option.value} type="button" aria-pressed={values.requested_resolution === option.value} className={values.requested_resolution === option.value ? "selected" : ""} onClick={() => change("requested_resolution", option.value)}><span className="choice-icon">{option.icon}</span><span><strong>{option.label}</strong><small>{option.note}</small></span><i>{values.requested_resolution === option.value && <Check />}</i></button>)}</div></fieldset>
        {claim.draft && <section className="edit-written-request"><div className="evidence-heading"><div><span className="eyebrow">Your written request</span><h2>Review the claim text</h2></div></div><p className="supporting-copy">If you change the product, issue, or resolution above, update the text below to match.</p><label className="full-field"><span>Subject</span><input name="subject" required maxLength={300} value={values.subject} onChange={event => change("subject", event.target.value)} /></label><label className="full-field"><span>Claim text</span><textarea name="body" required maxLength={12000} rows={10} value={values.body} onChange={event => change("body", event.target.value)} /></label></section>}
        <div className="evidence-heading"><div><span className="eyebrow">Captured during your call</span><h2>Evidence collected</h2></div></div><div className="edit-evidence-list">{claim.evidence.map(item => <a href={evidenceUrl(claim.id, item)} key={item.id} target="_blank" rel="noreferrer"><EvidencePreview claimId={claim.id} evidence={item} compact /><span>{item.filename}<small>View original evidence</small></span><ArrowRight /></a>)}{!claim.evidence.length && <p className="supporting-copy">No evidence attached yet.</p>}</div>
        <div className="form-actions"><Link href={href} className="save-link" aria-disabled={busy} onClick={event => { if (busy) event.preventDefault(); }}>Cancel</Link><button type="submit" className="button">{busy ? "Saving…" : "Save changes"}<ArrowRight /></button></div>
      </fieldset></form>}
    </section>
  </main>;
}

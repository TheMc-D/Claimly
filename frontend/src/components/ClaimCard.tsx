import Link from "next/link";
import { type Claim, claimProgress, formatDate, shortClaimId, statusLabel } from "@/lib/api";
import { ArrowRight } from "./Icons";
import EvidencePreview from "./EvidencePreview";

export default function ClaimCard({ claim }: { claim: Claim }) {
  const progress = claimProgress(claim);
  const photo = claim.evidence.find(item => item.content_type.startsWith("image/"));
  return <Link href={`/claims/${encodeURIComponent(claim.id)}`} className="claim-card" aria-label={`View details for ${claim.product}`}>
    <EvidencePreview key={photo?.id || claim.id} claimId={claim.id} evidence={photo} compact />
    <div className="claim-main"><div className="claim-title"><span title={claim.id}>{shortClaimId(claim.id)}</span><h3>{claim.product}</h3><p>{claim.issue}</p></div><span className="claim-evidence-count">{claim.evidence.length} evidence file{claim.evidence.length === 1 ? "" : "s"} · {claim.requested_resolution} requested</span>{claim.edited_at && <span className="claim-correction-note">Edited {formatDate(claim.edited_at)}</span>}</div>
    <div className="claim-date"><small>Created</small><span>{formatDate(claim.created_at)}</span></div>
    <div className="claim-progress"><div><small>Preparation</small><strong>{progress.completed} of 3</strong></div><span role="progressbar" aria-label="Claim preparation" aria-valuemin={0} aria-valuemax={3} aria-valuenow={progress.completed}><i style={{ width: `${progress.percent}%` }} /></span></div>
    <span className={`status status--${claim.status}`}><i />{statusLabel(claim)}</span>
    <span className="claim-view-details">View details <ArrowRight /></span>
  </Link>;
}
